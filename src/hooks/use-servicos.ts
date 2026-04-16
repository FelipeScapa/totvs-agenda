import { useState, useEffect, useCallback } from 'react';

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

function load(): Servico[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function save(servicos: Servico[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(servicos));
}

export function useServicos() {
  const [servicos, setServicos] = useState<Servico[]>(load);

  useEffect(() => { save(servicos); }, [servicos]);

  const adicionar = useCallback((nome: string, valor_hora: number) => {
    const id = nome.trim().toUpperCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const servico: Servico = { id, nome: nome.trim(), valor_hora, data_criacao: new Date().toISOString() };
    setServicos(prev => [servico, ...prev]);
  }, []);

  const remover = useCallback((id: string) => {
    setServicos(prev => prev.filter(s => s.id !== id));
  }, []);

  const atualizar = useCallback((id: string, nome: string, valor_hora: number) => {
    setServicos(prev => prev.map(s => s.id === id ? { ...s, nome: nome.trim(), valor_hora } : s));
  }, []);

  return { servicos, adicionar, remover, atualizar };
}
