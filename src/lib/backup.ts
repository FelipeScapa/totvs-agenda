import { listAllKeys } from './storage-store';

const APP_PREFIXES = ['agenda-log-', 'fin-', 'quick-mode-'];

function isAppKey(k: string) {
  return APP_PREFIXES.some(p => k.startsWith(p));
}

export function exportAll(): string {
  const data: Record<string, unknown> = {};
  for (const k of listAllKeys()) {
    if (!isAppKey(k)) continue;
    try {
      const raw = localStorage.getItem(k);
      data[k] = raw ? JSON.parse(raw) : null;
    } catch {
      data[k] = localStorage.getItem(k);
    }
  }
  return JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  }, null, 2);
}

export function downloadBackup() {
  const json = exportAll();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  a.href = url;
  a.download = `backup-${ts}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  imported: number;
  keys: string[];
}

export function importAll(json: string, mode: 'merge' | 'replace' = 'replace'): ImportResult {
  const parsed = JSON.parse(json);
  const data = parsed?.data ?? parsed;
  if (!data || typeof data !== 'object') throw new Error('Arquivo de backup inválido');
  if (mode === 'replace') {
    for (const k of listAllKeys()) if (isAppKey(k)) localStorage.removeItem(k);
  }
  const keys: string[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (!isAppKey(k)) continue;
    localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    keys.push(k);
  }
  return { imported: keys.length, keys };
}
