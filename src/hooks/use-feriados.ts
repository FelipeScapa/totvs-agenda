import { useCallback } from 'react';
import { useCloudCollection, cloudInsert, cloudUpdate, cloudDelete } from '@/lib/cloud-collection';

export type TipoFeriado = 'FERIAS' | 'FERIADO' | 'FOLGA';

export interface Feriado {
  id: string;
  tipo: TipoFeriado;
  descricao: string;
  data_inicio: string; // YYYY-MM-DD
  data_fim: string;    // YYYY-MM-DD (inclusive)
  data_criacao: string;
}

const TABLE = 'feriados';

export function useFeriados() {
  const { data: feriados } = useCloudCollection<Feriado>(TABLE);

  const adicionar = useCallback((f: Omit<Feriado, 'id' | 'data_criacao'>) => {
    cloudInsert(TABLE, { ...f, id: crypto.randomUUID(), data_criacao: new Date().toISOString() });
  }, []);
  const atualizar = useCallback((id: string, updates: Partial<Feriado>) => {
    cloudUpdate<Feriado>(TABLE, id, updates);
  }, []);
  const remover = useCallback((id: string) => {
    cloudDelete(TABLE, id);
  }, []);

  const getFeriado = useCallback(
    (data: string): Feriado | null => {
      return feriados.find(f => data >= f.data_inicio && data <= f.data_fim) ?? null;
    },
    [feriados],
  );

  // Não computa horas/valor: apenas FERIAS e FERIADO. FOLGA continua contabilizando se houver agenda.
  const isDiaNaoComputado = useCallback(
    (data: string): Feriado | null => {
      const f = getFeriado(data);
      return f && f.tipo !== 'FOLGA' ? f : null;
    },
    [getFeriado],
  );

  // Para previsão de horas úteis: qualquer um dos 3 tipos remove o dia da previsão
  const isDiaForaPrevisao = useCallback(
    (data: string): boolean => {
      return getFeriado(data) !== null;
    },
    [getFeriado],
  );

  return { feriados, adicionar, atualizar, remover, isDiaNaoComputado, getFeriado, isDiaForaPrevisao };
}
