import { useState, useEffect, useCallback } from 'react';

export interface Cliente {
  id: string;
  nome: string;
  data_criacao: string;
}

const STORAGE_KEY = 'agenda-log-clientes';

function load(): Cliente[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function save(clientes: Cliente[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));
}

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>(load);

  useEffect(() => { save(clientes); }, [clientes]);

  const adicionar = useCallback((nome: string) => {
    const cliente: Cliente = { id: crypto.randomUUID(), nome: nome.trim(), data_criacao: new Date().toISOString() };
    setClientes(prev => [cliente, ...prev]);
  }, []);

  const remover = useCallback((id: string) => {
    setClientes(prev => prev.filter(c => c.id !== id));
  }, []);

  const atualizar = useCallback((id: string, nome: string) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, nome: nome.trim() } : c));
  }, []);

  return { clientes, adicionar, remover, atualizar };
}
