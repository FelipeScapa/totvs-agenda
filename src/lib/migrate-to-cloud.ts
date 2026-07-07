import { supabase } from '@/integrations/supabase/client';

const FLAG = 'agenda-log-cloud-migrated-v1';

interface TableSpec {
  ls: string;
  table: string;
  transform?: (row: Record<string, unknown>) => Record<string, unknown>;
}

const SPECS: TableSpec[] = [
  { ls: 'agenda-log-atendimentos', table: 'atendimentos' },
  { ls: 'agenda-log-clientes', table: 'clientes' },
  { ls: 'agenda-log-servicos', table: 'servicos' },
  {
    ls: 'agenda-log-tipos',
    table: 'tipos_atendimento',
    // registro antigo tem { id, label } — nada a transformar
  },
  { ls: 'agenda-log-feriados', table: 'feriados' },
  { ls: 'agenda-log-pendencias', table: 'pendencias' },
];

/**
 * Sobe uma única vez tudo o que estiver no localStorage para a nuvem.
 * Só faz upload numa tabela se ela ainda estiver vazia — evita duplicar
 * dados se o usuário já usa a nuvem em outro navegador.
 */
export async function migrateLocalStorageToCloud() {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(FLAG)) return;

  let migratedCount = 0;

  for (const spec of SPECS) {
    try {
      const raw = localStorage.getItem(spec.ls);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) continue;

      // Só migra se a tabela remota estiver vazia.
      const { count, error: countErr } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(spec.table as any)
        .select('id', { count: 'exact', head: true });
      if (countErr) {
        console.error(`[migrate] falha ao ler ${spec.table}`, countErr);
        continue;
      }
      if ((count ?? 0) > 0) continue;

      const rows = parsed.map(r => (spec.transform ? spec.transform(r) : r));
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(spec.table as any)
        .upsert(rows as never);
      if (error) {
        console.error(`[migrate] falha ao migrar ${spec.table}`, error);
        continue;
      }
      migratedCount += rows.length;
      console.info(`[migrate] ${spec.table}: ${rows.length} registros enviados`);
    } catch (e) {
      console.error(`[migrate] erro em ${spec.ls}`, e);
    }
  }

  localStorage.setItem(FLAG, new Date().toISOString());
  if (migratedCount > 0) {
    console.info(`[migrate] concluído — ${migratedCount} registros enviados para a nuvem.`);
  }
}
