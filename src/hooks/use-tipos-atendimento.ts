import { useCallback } from 'react';
import { useCloudCollection, cloudInsert, cloudDelete } from '@/lib/cloud-collection';

export interface TipoCustom {
  id: string;
  label: string;
}

const TABLE = 'tipos_atendimento';

export function useTiposAtendimento() {
  const { data: tipos } = useCloudCollection<TipoCustom>(TABLE, { orderBy: 'id', ascending: true });

  const adicionar = useCallback((label: string) => {
    const id = label
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    cloudInsert(TABLE, { id, label: label.trim() }, 'end');
  }, []);

  const remover = useCallback((id: string) => {
    cloudDelete(TABLE, id);
  }, []);

  return { tipos, adicionar, remover };
}
