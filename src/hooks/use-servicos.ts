import { useCallback, useSyncExternalStore } from 'react';

export interface Servico {
  id: string;
  nome: string;
  valor_hora: number;
  data_criacao: string;
}

const STORAGE_KEY = 'agenda-log-servicos';

const DEFAULTS: Servico[] = [
  { id: 'TOTVS', nome: 'TOTVS', valor_hora: 26, data_criacao: new Date().toISOString() },
];

let listeners: (() => void)[] = [];
let cache: Servico[] | null = null;

function load(): Servico[] {
  if (cache) return cache;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    cache = data ? JSON.parse(data) : DEFAULTS;
  } catch {
    cache = DEFAULTS;
  }
  return cache!;
}

function save(servicos: Servico[]) {
  cache = servicos;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(servicos));
  listeners.forEach(l => l());
}

function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => { listeners = listeners.filter(l => l !== cb); };
}

export function useServicos() {
  const servicos = useSyncExternalStore(subscribe, load);

  const adicionar = useCallback((nome: string, valor_hora: number) => {
    const id = nome.trim().toUpperCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const servico: Servico = { id, nome: nome.trim(), valor_hora, data_criacao: new Date().toISOString() };
    save([servico, ...load()]);
  }, []);

  const remover = useCallback((id: string) => {
    save(load().filter(s => s.id !== id));
  }, []);

  const atualizar = useCallback((id: string, nome: string, valor_hora: number) => {
    save(load().map(s => s.id === id ? { ...s, nome: nome.trim(), valor_hora } : s));
  }, []);

  return { servicos, adicionar, remover, atualizar };
}
