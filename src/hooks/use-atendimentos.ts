import { useCallback } from 'react';
import { Atendimento } from '@/types/atendimento';
import { useStored } from '@/lib/storage-store';

const STORAGE_KEY = 'agenda-log-atendimentos';

export function useAtendimentos() {
  const [atendimentos, setAtendimentos] = useStored<Atendimento[]>(STORAGE_KEY, []);

  const adicionar = useCallback((atendimento: Atendimento) => {
    setAtendimentos(prev => [atendimento, ...prev]);
  }, [setAtendimentos]);

  const atualizar = useCallback((id: string, updates: Partial<Atendimento>) => {
    setAtendimentos(prev =>
      prev.map(a =>
        a.id === id ? { ...a, ...updates, data_atualizacao: new Date().toISOString() } : a
      )
    );
  }, [setAtendimentos]);

  const remover = useCallback((id: string) => {
    setAtendimentos(prev => prev.filter(a => a.id !== id));
  }, [setAtendimentos]);

  return { atendimentos, adicionar, atualizar, remover };
}
