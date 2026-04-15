import { useState, useEffect, useCallback } from 'react';
import { Atendimento } from '@/types/atendimento';

const STORAGE_KEY = 'agenda-log-atendimentos';

function loadAtendimentos(): Atendimento[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveAtendimentos(atendimentos: Atendimento[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(atendimentos));
}

export function useAtendimentos() {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>(loadAtendimentos);

  useEffect(() => {
    saveAtendimentos(atendimentos);
  }, [atendimentos]);

  const adicionar = useCallback((atendimento: Atendimento) => {
    setAtendimentos(prev => [atendimento, ...prev]);
  }, []);

  const atualizar = useCallback((id: string, updates: Partial<Atendimento>) => {
    setAtendimentos(prev =>
      prev.map(a =>
        a.id === id ? { ...a, ...updates, data_atualizacao: new Date().toISOString() } : a
      )
    );
  }, []);

  const remover = useCallback((id: string) => {
    setAtendimentos(prev => prev.filter(a => a.id !== id));
  }, []);

  return { atendimentos, adicionar, atualizar, remover };
}
