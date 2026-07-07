import { useCallback } from 'react';
import { useCloudCollection, cloudInsert, cloudUpdate, cloudDelete } from '@/lib/cloud-collection';

export type PendenciaStatus = 'ABERTA' | 'EM_ANDAMENTO' | 'VALIDACAO' | 'CONCLUIDA';

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

const TABLE = 'pendencias';

export function usePendencias() {
  const { data: pendencias } = useCloudCollection<Pendencia>(TABLE);

  const adicionar = useCallback(
    (p: Omit<Pendencia, 'id' | 'data_criacao' | 'data_atualizacao'>) => {
      const now = new Date().toISOString();
      const novo: Pendencia = { ...p, id: crypto.randomUUID(), data_criacao: now, data_atualizacao: now };
      cloudInsert(TABLE, novo);
    },
    [],
  );

  const atualizar = useCallback((id: string, updates: Partial<Pendencia>) => {
    cloudUpdate<Pendencia>(TABLE, id, { ...updates, data_atualizacao: new Date().toISOString() });
  }, []);

  const remover = useCallback((id: string) => {
    cloudDelete(TABLE, id);
  }, []);

  return { pendencias, adicionar, atualizar, remover };
}
