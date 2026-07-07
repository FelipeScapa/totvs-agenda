import { useCallback, useSyncExternalStore } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Listener = () => void;

interface Store<T> {
  table: string;
  data: T[];
  loaded: boolean;
  loading: Promise<void> | null;
  listeners: Set<Listener>;
}

const stores = new Map<string, Store<unknown>>();

function getStore<T>(table: string): Store<T> {
  let s = stores.get(table) as Store<T> | undefined;
  if (!s) {
    s = { table, data: [], loaded: false, loading: null, listeners: new Set() };
    stores.set(table, s as Store<unknown>);
  }
  return s;
}

function notify<T>(s: Store<T>) {
  s.listeners.forEach(l => l());
}

interface Options {
  orderBy?: string;
  ascending?: boolean;
}

export function useCloudCollection<T extends { id: string }>(
  table: string,
  opts: Options = {},
) {
  const { orderBy = 'data_criacao', ascending = false } = opts;
  const s = getStore<T>(table);

  if (!s.loaded && !s.loading) {
    s.loading = (async () => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(table as any)
        .select('*')
        .order(orderBy, { ascending });
      if (error) {
        console.error(`[cloud:${table}] load failed`, error);
      }
      s.data = ((data ?? []) as unknown) as T[];
      s.loaded = true;
      notify(s);
    })();
  }

  const subscribe = useCallback(
    (cb: Listener) => {
      s.listeners.add(cb);
      return () => {
        s.listeners.delete(cb);
      };
    },
    [s],
  );

  const data = useSyncExternalStore(
    subscribe,
    () => s.data,
    () => s.data,
  );

  return { data, loaded: s.loaded };
}

/** Wait until the initial load of a table finished. */
export function awaitLoaded(table: string): Promise<void> {
  const s = getStore(table);
  if (s.loaded) return Promise.resolve();
  if (s.loading) return s.loading;
  // Trigger a load if nothing has yet.
  s.loading = (async () => {
    const { data, error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(table as any)
      .select('*');
    if (error) console.error(`[cloud:${table}] load failed`, error);
    s.data = (data ?? []) as unknown[];
    s.loaded = true;
    notify(s);
  })();
  return s.loading;
}

export function getCached<T>(table: string): T[] {
  return (getStore<T>(table).data as unknown) as T[];
}

export async function cloudInsert<T extends { id: string }>(table: string, row: T, position: 'start' | 'end' = 'start') {
  const s = getStore<T>(table);
  const prev = s.data;
  s.data = position === 'start' ? [row, ...prev] : [...prev, row];
  notify(s);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from(table as any).insert(row as any);
  if (error) {
    console.error(`[cloud:${table}] insert failed`, error);
    s.data = prev;
    notify(s);
  }
}

export async function cloudUpsertMany<T extends { id: string }>(table: string, rows: T[]) {
  if (!rows.length) return;
  const s = getStore<T>(table);
  const prev = s.data;
  const map = new Map(prev.map(r => [r.id, r]));
  for (const r of rows) map.set(r.id, r);
  s.data = Array.from(map.values());
  notify(s);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from(table as any).upsert(rows as any);
  if (error) {
    console.error(`[cloud:${table}] upsert failed`, error);
    s.data = prev;
    notify(s);
  }
}

export async function cloudUpdate<T extends { id: string }>(table: string, id: string, patch: Partial<T>) {
  const s = getStore<T>(table);
  const prev = s.data;
  s.data = prev.map(x => (x.id === id ? { ...x, ...patch } : x));
  notify(s);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from(table as any).update(patch as any).eq('id', id);
  if (error) {
    console.error(`[cloud:${table}] update failed`, error);
    s.data = prev;
    notify(s);
  }
}

export async function cloudDelete<T extends { id: string }>(table: string, id: string) {
  const s = getStore<T>(table);
  const prev = s.data;
  s.data = prev.filter(x => x.id !== id);
  notify(s);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from(table as any).delete().eq('id', id);
  if (error) {
    console.error(`[cloud:${table}] delete failed`, error);
    s.data = prev;
    notify(s);
  }
}
