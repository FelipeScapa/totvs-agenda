import { beforeEach, describe, expect, it, vi } from 'vitest';
const { from, upsert, range, pages } = vi.hoisted(() => ({
  from: vi.fn(), upsert: vi.fn(), range: vi.fn(), pages: {} as Record<string, Record<string, unknown>[]>,
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from } }));
import { BACKUP_TABLES, exportAll, importAll, parseBackup } from './backup';

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  for (const key of Object.keys(pages)) delete pages[key];
  upsert.mockResolvedValue({ error: null });
  from.mockImplementation((table: string) => ({
    select: () => ({ order: () => ({ range: (start: number, end: number) => {
      range(start, end);
      return Promise.resolve({ data: (pages[table] ?? []).slice(start, end + 1), error: null });
    } }) }),
    upsert,
  }));
});

describe('application data backup', () => {
  it('exports all eight cloud collections and local finances without authentication keys or stale appointments', async () => {
    for (const table of BACKUP_TABLES) pages[table] = [{ id: `${table}-1` }];
    localStorage.setItem('fin-contas', '[{"id":"conta"}]');
    localStorage.setItem('agenda-log-atendimentos', '[{"id":"old"}]');
    localStorage.setItem('sb-auth-token', 'private');
    const result = JSON.parse(await exportAll());
    expect(Object.keys(result.cloud).sort()).toEqual([...BACKUP_TABLES].sort());
    expect(result.cloud.atendimentos).toEqual([{ id: 'atendimentos-1' }]);
    expect(result.cloud.configuracoes).toEqual([{ id: 'configuracoes-1' }]);
    expect(result.cloud.atendimento_anexos).toEqual([{ id: 'atendimento_anexos-1' }]);
    expect(result.data).toEqual({ 'fin-contas': [{ id: 'conta' }] });
    expect(result.storageFilesIncluded).toBe(false);
  });
  it('exports beyond the first page without truncating agendas', async () => {
    pages.atendimentos = Array.from({ length: 1205 }, (_, i) => ({ id: String(i) }));
    expect(JSON.parse(await exportAll()).cloud.atendimentos).toHaveLength(1205);
    expect(range).toHaveBeenCalledWith(1000, 1499);
  });
  it('fails instead of downloading an incomplete export when any cloud table fails', async () => {
    from.mockReturnValue({ select: () => ({ order: () => ({ range: async () => ({ error: { message: 'offline' }, data: null }) }) }) });
    await expect(exportAll()).rejects.toThrow('Nenhum backup foi baixado');
  });
  it('rejects an incomplete new backup before writing any records', async () => {
    await expect(importAll(JSON.stringify({ version: 2, cloud: { atendimentos: [{ id: 'a' }] }, data: {} }))).rejects.toThrow();
    expect(upsert).not.toHaveBeenCalled();
  });
  it('imports legacy agendas into the cloud and preserves existing local finance data', async () => {
    localStorage.setItem('fin-contas', '[{"id":"current"}]');
    await importAll(JSON.stringify({ version: 1, data: { 'agenda-log-atendimentos': [{ id: 'old' }], 'fin-contas': [{ id: 'old-account' }] } }));
    expect(from).toHaveBeenCalledWith('atendimentos');
    expect(upsert).toHaveBeenCalledWith([{ id: 'old' }], { onConflict: 'id', ignoreDuplicates: true });
    expect(localStorage.getItem('fin-contas')).toBe('[{"id":"current"}]');
  });
  it('rejects unrelated JSON instead of silently claiming restoration', () => {
    expect(() => parseBackup('{"unrelated":[]}')).toThrow('não contém dados');
  });
});