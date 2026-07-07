import { useCallback } from 'react';
import { Atendimento } from '@/types/atendimento';
import { useCloudCollection, cloudInsert, cloudUpdate, cloudDelete } from '@/lib/cloud-collection';

const TABLE = 'atendimentos';

export function useAtendimentos() {
  const { data: atendimentos } = useCloudCollection<Atendimento>(TABLE);

  const adicionar = useCallback((atendimento: Atendimento) => {
    cloudInsert(TABLE, atendimento);
  }, []);

  const atualizar = useCallback((id: string, updates: Partial<Atendimento>) => {
    cloudUpdate<Atendimento>(TABLE, id, { ...updates, data_atualizacao: new Date().toISOString() });
  }, []);

  const remover = useCallback((id: string) => {
    cloudDelete(TABLE, id);
  }, []);

  return { atendimentos, adicionar, atualizar, remover };
}
