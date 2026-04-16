import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

export interface Cliente {
  id: string;
  nome: string;
  data_criacao: string;
}

const STORAGE_KEY = 'agenda-log-clientes';
let listeners: (() => void)[] = [];
let cache: Cliente[] | null = null;

function load(): Cliente[] {
  if (cache) return cache;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    cache = data ? JSON.parse(data) : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function save(clientes: Cliente[]) {
  cache = clientes;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));
  listeners.forEach(l => l());
}

function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => { listeners = listeners.filter(l => l !== cb); };
}

function getSnapshot() {
  return load();
}

export function useClientes() {
  const clientes = useSyncExternalStore(subscribe, getSnapshot);

  const adicionar = useCallback((nome: string) => {
    const cliente: Cliente = { id: crypto.randomUUID(), nome: nome.trim(), data_criacao: new Date().toISOString() };
    save([cliente, ...load()]);
  }, []);

  const remover = useCallback((id: string) => {
    save(load().filter(c => c.id !== id));
  }, []);

  const atualizar = useCallback((id: string, nome: string) => {
    save(load().map(c => c.id === id ? { ...c, nome: nome.trim() } : c));
  }, []);

  return { clientes, adicionar, remover, atualizar };
}
