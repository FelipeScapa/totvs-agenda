import { listAllKeys } from './storage-store';
import { supabase } from '@/integrations/supabase/client';

// Application records only: this is not a full Lovable Cloud database export.
export const BACKUP_TABLES = ['clientes', 'servicos', 'tipos_atendimento', 'configuracoes', 'feriados', 'pendencias', 'atendimentos', 'atendimento_anexos'] as const;
type BackupTable = typeof BACKUP_TABLES[number];
type Row = Record<string, unknown> & { id: string };
const LEGACY_TABLES: Record<string, BackupTable> = {
  'agenda-log-atendimentos': 'atendimentos', 'agenda-log-clientes': 'clientes',
  'agenda-log-servicos': 'servicos', 'agenda-log-tipos': 'tipos_atendimento',
  'agenda-log-feriados': 'feriados', 'agenda-log-pendencias': 'pendencias',
};
const isAppKey = (key: string) => ['agenda-log-', 'fin-', 'quick-mode-'].some(p => key.startsWith(p)) && key !== 'agenda-log-cloud-migrated-v1';
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

export async function exportAll(): Promise<string> {
  const data: Record<string, unknown> = {};
  for (const key of listAllKeys()) {
    if (!isAppKey(key) || key in LEGACY_TABLES) continue;
    const raw = localStorage.getItem(key);
    try { data[key] = raw ? JSON.parse(raw) : null; }
    catch { data[key] = raw; }
  }
  const cloud: Partial<Record<BackupTable, Row[]>> = {};
  await Promise.all(BACKUP_TABLES.map(async table => {
    const rows: Row[] = [];
    // A small page also works with the database's default row limit.
    const pageSize = 500;
    for (let offset = 0; ; offset += pageSize) {
      const { data: page, error } = await supabase.from(table).select('*').order('id').range(offset, offset + pageSize - 1);
      if (error) throw new Error(`Não foi possível exportar ${table}: ${error.message}. Nenhum backup foi baixado.`);
      if (!page) throw new Error(`Resposta vazia ao exportar ${table}. Tente novamente.`);
      rows.push(...page as Row[]);
      if (page.length < pageSize) break;
    }
    cloud[table] = rows;
  }));
  return JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), scope: 'application-records', storageFilesIncluded: false, data, cloud }, null, 2);
}

export async function downloadBackup() {
  const json = await exportAll();
  const parsed = JSON.parse(json);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-agenda-financeiro-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return BACKUP_TABLES.reduce((sum, table) => sum + parsed.cloud[table].length, 0);
}

export interface ImportResult { imported: number; keys: string[] }

export function parseBackup(json: string) {
  const parsed: unknown = JSON.parse(json);
  if (!isObject(parsed)) throw new Error('Arquivo de backup inválido');
  if (parsed.version !== undefined && parsed.version !== 1 && parsed.version !== 2) throw new Error('Versão de backup não suportada');
  const data = parsed.data ?? parsed;
  if (!isObject(data)) throw new Error('Dados locais inválidos');
  const cloud: Partial<Record<BackupTable, Row[]>> = {};
  if (parsed.version === 2) {
    if (!isObject(parsed.cloud)) throw new Error('Backup sem os registros da nuvem');
    for (const table of BACKUP_TABLES) {
      const rows = parsed.cloud[table];
      if (!Array.isArray(rows) || rows.some(row => !isObject(row) || typeof row.id !== 'string' || !row.id)) throw new Error(`Registros inválidos: ${table}`);
      cloud[table] = rows as Row[];
    }
  } else {
    for (const [key, table] of Object.entries(LEGACY_TABLES)) {
      if (!(key in data)) continue;
      const rows = typeof data[key] === 'string' ? JSON.parse(data[key] as string) : data[key];
      if (!Array.isArray(rows) || rows.some(row => !isObject(row) || typeof row.id !== 'string' || !row.id)) throw new Error(`Registros inválidos: ${key}`);
      cloud[table] = rows as Row[];
    }
  }
  if (!Object.keys(cloud).length && !Object.keys(data).some(isAppKey)) throw new Error('O arquivo não contém dados do aplicativo');
  return { data, cloud };
}

export async function importAll(json: string): Promise<ImportResult> {
  // Validate the entire envelope before writing anything. Never delete records.
  const { data, cloud } = parseBackup(json);
  let imported = 0;
  for (const table of BACKUP_TABLES) {
    const rows = cloud[table] ?? [];
    for (let offset = 0; offset < rows.length; offset += 100) {
      // Existing records are retained, including changes made after the backup.
      const { error } = await supabase.from(table).upsert(rows.slice(offset, offset + 100) as never, { onConflict: 'id', ignoreDuplicates: true });
      if (error) throw new Error(`Falha em ${table}: ${error.message}. A importação pode ter sido parcial; tente novamente. Nenhum registro existente foi excluído.`);
    }
    imported += rows.length;
  }
  const keys: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (!isAppKey(key) || key in LEGACY_TABLES || localStorage.getItem(key) !== null) continue;
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    keys.push(key);
  }
  return { imported, keys };
}