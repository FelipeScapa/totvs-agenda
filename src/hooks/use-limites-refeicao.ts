import { useCallback } from 'react';
import { useCloudCollection, cloudInsert, cloudUpdate } from '@/lib/cloud-collection';
import { LimitesRefeicao, LIMITES_PADRAO } from '@/types/atendimento';

const TABLE = 'configuracoes';
const ID = 'limites_refeicao';

interface Config { id: string; valor: Partial<LimitesRefeicao> }

export function useLimitesRefeicao() {
  const { data } = useCloudCollection<Config>(TABLE);
  const row = data.find(c => c.id === ID);
  const limites: LimitesRefeicao = { ...LIMITES_PADRAO, ...(row?.valor ?? {}) };

  const salvar = useCallback((l: LimitesRefeicao) => {
    if (row) cloudUpdate<Config>(TABLE, ID, { valor: l });
    else cloudInsert<Config>(TABLE, { id: ID, valor: l });
  }, [row]);

  return { limites, salvar };
}
