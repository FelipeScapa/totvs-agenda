import { useCallback, useSyncExternalStore } from 'react';

export interface TipoCustom {
  id: string;
  label: string;
}

const STORAGE_KEY = 'agenda-log-tipos';

const DEFAULTS: TipoCustom[] = [
  { id: 'SUPORTE', label: 'Suporte' },
  { id: 'AJUSTE', label: 'Ajuste' },
  { id: 'REUNIAO', label: 'Reunião' },
  { id: 'INVESTIGACAO', label: 'Investigação' },
];

let listeners: (() => void)[] = [];
let cache: TipoCustom[] | null = null;

function load(): TipoCustom[] {
  if (cache) return cache;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    cache = data ? JSON.parse(data) : DEFAULTS;
  } catch {
    cache = DEFAULTS;
  }
  return cache!;
}

function save(tipos: TipoCustom[]) {
  cache = tipos;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tipos));
  listeners.forEach(l => l());
}

function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => { listeners = listeners.filter(l => l !== cb); };
}

export function useTiposAtendimento() {
  const tipos = useSyncExternalStore(subscribe, load);

  const adicionar = useCallback((label: string) => {
    const id = label.trim().toUpperCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    save([...load(), { id, label: label.trim() }]);
  }, []);

  const remover = useCallback((id: string) => {
    save(load().filter(t => t.id !== id));
  }, []);

  return { tipos, adicionar, remover };
}
