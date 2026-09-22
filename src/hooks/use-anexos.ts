import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const BUCKET = 'anexos-agenda';

export interface Anexo {
  id: string;
  atendimento_id: string;
  nome: string;
  path: string;
  tamanho: number;
  tipo: string;
  data_criacao: string;
}

export function useAnexos(atendimentoId: string | null, enabled = true) {
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [loading, setLoading] = useState(false);

  const carregar = useCallback(async () => {
    if (!atendimentoId) { setAnexos([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('atendimento_anexos')
      .select('*')
      .eq('atendimento_id', atendimentoId)
      .order('data_criacao', { ascending: true });
    if (error) console.error('[anexos] load', error);
    setAnexos((data ?? []) as Anexo[]);
    setLoading(false);
  }, [atendimentoId]);

  useEffect(() => { if (enabled) carregar(); }, [carregar, enabled]);

  const enviar = useCallback(async (file: File) => {
    if (!atendimentoId) return { error: 'sem-id' };
    const id = crypto.randomUUID();
    const safe = file.name.replace(/[^\w.\-]+/g, '_');
    const path = `${atendimentoId}/${id}-${safe}`;
    const up = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
    if (up.error) {
      console.error('[anexos] upload', up.error);
      return { error: up.error.message };
    }
    const row = {
      id,
      atendimento_id: atendimentoId,
      nome: file.name,
      path,
      tamanho: file.size,
      tipo: file.type || '',
    };
    const { error } = await supabase.from('atendimento_anexos').insert(row);
    if (error) {
      console.error('[anexos] insert', error);
      await supabase.storage.from(BUCKET).remove([path]);
      return { error: error.message };
    }
    await carregar();
    return {};
  }, [atendimentoId, carregar]);

  const remover = useCallback(async (anexo: Anexo) => {
    setAnexos(prev => prev.filter(a => a.id !== anexo.id));
    await supabase.storage.from(BUCKET).remove([anexo.path]);
    const { error } = await supabase.from('atendimento_anexos').delete().eq('id', anexo.id);
    if (error) { console.error('[anexos] delete', error); carregar(); }
  }, [carregar]);

  return { anexos, loading, enviar, remover, recarregar: carregar };
}

export async function urlAnexo(path: string, download = false): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 10, download ? { download: true } : undefined);
  if (error) { console.error('[anexos] signed url', error); return null; }
  return data?.signedUrl ?? null;
}
