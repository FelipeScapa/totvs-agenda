import { useCallback } from 'react';
import { useCloudCollection, cloudInsert, cloudUpdate, cloudDelete } from '@/lib/cloud-collection';

export interface Cliente {
  id: string;
  nome: string;
  data_criacao: string;
}

const TABLE = 'clientes';

export function useClientes() {
  const { data: clientes } = useCloudCollection<Cliente>(TABLE);

  const adicionar = useCallback((nome: string) => {
    const cliente: Cliente = {
      id: crypto.randomUUID(),
      nome: nome.trim(),
      data_criacao: new Date().toISOString(),
    };
    cloudInsert(TABLE, cliente);
  }, []);

  const remover = useCallback((id: string) => {
    cloudDelete(TABLE, id);
  }, []);

  const atualizar = useCallback((id: string, nome: string) => {
    cloudUpdate<Cliente>(TABLE, id, { nome: nome.trim() });
  }, []);

  return { clientes, adicionar, remover, atualizar };
}
