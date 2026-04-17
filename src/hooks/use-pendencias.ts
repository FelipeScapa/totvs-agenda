import { useCallback, useSyncExternalStore } from 'react';

export type PendenciaStatus = 'ABERTA' | 'EM_ANDAMENTO' | 'CONCLUIDA';

export interface Pendencia {
  id: string;
  cliente: string;
  titulo: string;
  descricao: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA';
  status: PendenciaStatus;
  prazo?: string; // YYYY-MM-DD
  data_criacao: string;
  data_atualizacao: string;
}

const STORAGE_KEY = 'agenda-log-pendencias';
let listeners: (() => void)[] = [];
let cache: Pendencia[] | null = null;

function load(): Pendencia[] {
  if (cache) return cache;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    cache = data ? JSON.parse(data) : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function save(p: Pendencia[]) {
  cache = p;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  listeners.forEach(l => l());
}

function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => { listeners = listeners.filter(l => l !== cb); };
}

export function usePendencias() {
  const pendencias = useSyncExternalStore(subscribe, load);

  const adicionar = useCallback((p: Omit<Pendencia, 'id' | 'data_criacao' | 'data_atualizacao'>) => {
    const now = new Date().toISOString();
    const novo: Pendencia = { ...p, id: crypto.randomUUID(), data_criacao: now, data_atualizacao: now };
    save([novo, ...load()]);
  }, []);

  const atualizar = useCallback((id: string, updates: Partial<Pendencia>) => {
    save(load().map(x => x.id === id ? { ...x, ...updates, data_atualizacao: new Date().toISOString() } : x));
  }, []);

  const remover = useCallback((id: string) => {
    save(load().filter(x => x.id !== id));
  }, []);

  return { pendencias, adicionar, atualizar, remover };
}
