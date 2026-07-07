import { useCallback } from 'react';
import { useCloudCollection, cloudInsert, cloudUpdate, cloudDelete } from '@/lib/cloud-collection';

export interface Servico {
  id: string;
  nome: string;
  valor_hora: number;
  data_criacao: string;
}

const TABLE = 'servicos';

export function useServicos() {
  const { data: servicos } = useCloudCollection<Servico>(TABLE);

  const adicionar = useCallback((nome: string, valor_hora: number) => {
    const id = nome
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const servico: Servico = {
      id,
      nome: nome.trim(),
      valor_hora,
      data_criacao: new Date().toISOString(),
    };
    cloudInsert(TABLE, servico);
  }, []);

  const remover = useCallback((id: string) => {
    cloudDelete(TABLE, id);
  }, []);

  const atualizar = useCallback((id: string, nome: string, valor_hora: number) => {
    cloudUpdate<Servico>(TABLE, id, { nome: nome.trim(), valor_hora });
  }, []);

  return { servicos, adicionar, remover, atualizar };
}
