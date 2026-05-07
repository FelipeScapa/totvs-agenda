import { useCallback, useSyncExternalStore } from 'react';

export type TipoFeriado = 'FERIAS' | 'FERIADO' | 'FOLGA';

export interface Feriado {
  id: string;
  tipo: TipoFeriado;
  descricao: string;
  data_inicio: string; // YYYY-MM-DD
  data_fim: string;    // YYYY-MM-DD (inclusive)
  data_criacao: string;
}

const STORAGE_KEY = 'agenda-log-feriados';
let listeners: (() => void)[] = [];
let cache: Feriado[] | null = null;

function load(): Feriado[] {
  if (cache) return cache;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    cache = data ? JSON.parse(data) : [];
  } catch { cache = []; }
  return cache!;
}

function save(list: Feriado[]) {
  cache = list;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  listeners.forEach(l => l());
}

function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => { listeners = listeners.filter(l => l !== cb); };
}

export function useFeriados() {
  const feriados = useSyncExternalStore(subscribe, load);

  const adicionar = useCallback((f: Omit<Feriado, 'id' | 'data_criacao'>) => {
    save([{ ...f, id: crypto.randomUUID(), data_criacao: new Date().toISOString() }, ...load()]);
  }, []);
  const atualizar = useCallback((id: string, updates: Partial<Feriado>) => {
    save(load().map(x => x.id === id ? { ...x, ...updates } : x));
  }, []);
  const remover = useCallback((id: string) => {
    save(load().filter(x => x.id !== id));
  }, []);

  const isDiaNaoComputado = useCallback((data: string): Feriado | null => {
    return feriados.find(f => data >= f.data_inicio && data <= f.data_fim) ?? null;
  }, [feriados]);

  return { feriados, adicionar, atualizar, remover, isDiaNaoComputado };
}
