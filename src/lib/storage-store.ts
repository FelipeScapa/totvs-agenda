import { useCallback, useSyncExternalStore } from 'react';

type Listener = () => void;

interface Store<T> {
  key: string;
  cache: T;
  listeners: Set<Listener>;
}

const stores = new Map<string, Store<any>>();

function getStore<T>(key: string, initial: T): Store<T> {
  let s = stores.get(key) as Store<T> | undefined;
  if (!s) {
    let cached: T = initial;
    try {
      const raw = localStorage.getItem(key);
      if (raw) cached = JSON.parse(raw);
    } catch {}
    s = { key, cache: cached, listeners: new Set() };
    stores.set(key, s);
  }
  return s;
}

export function setStored<T>(key: string, value: T) {
  const s = getStore<T>(key, value);
  s.cache = value;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  s.listeners.forEach(l => l());
}

export function getStored<T>(key: string, initial: T): T {
  return getStore<T>(key, initial).cache;
}

export function useStored<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const s = getStore<T>(key, initial);
  const subscribe = useCallback((cb: Listener) => {
    s.listeners.add(cb);
    return () => { s.listeners.delete(cb); };
  }, [s]);
  const value = useSyncExternalStore(subscribe, () => s.cache, () => s.cache);
  const set = useCallback((v: T | ((prev: T) => T)) => {
    const next = typeof v === 'function' ? (v as (p: T) => T)(s.cache) : v;
    setStored(key, next);
  }, [key, s]);
  return [value, set];
}

export function listAllKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) keys.push(k);
  }
  return keys;
}
