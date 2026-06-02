import { FinTransacao, FinFinanciamento, FinConta, CATEGORIA_DEVEDOR_ID } from '@/types/financeiro';

export const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const mesAtual = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const mesDeData = (data: string) => data.slice(0, 7);

export const labelMes = (mes: string) => {
  const [y, m] = mes.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

export function navegarMes(mes: string, delta: number): string {
  const [y, m] = mes.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function ultimoDiaDoMes(mes: string): string {
  const [y, m] = mes.split('-').map(Number);
  const d = new Date(y, m, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Gera todas as transações virtuais de um financiamento
export function gerarTransacoesFinanciamento(f: FinFinanciamento): FinTransacao[] {
  const [refY, refM] = f.mes_referencia.split('-').map(Number);
  const out: FinTransacao[] = [];
  for (let i = 1; i <= f.total_parcelas; i++) {
    const offset = i - f.parcela_atual;
    const d = new Date(refY, refM - 1 + offset, Math.min(f.dia_vencimento, 28));
    const dataStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    out.push({
      id: `${f.id}-p${i}`,
      data: dataStr,
      descricao: `${f.descricao} (${i}/${f.total_parcelas})`,
      movimento: 'DESPESA',
      categoria_id: f.categoria_id,
      tipo_id: f.tipo_id,
      conta_id: f.conta_id,
      valor: f.valor_parcela,
      pago: i < f.parcela_atual,
      financiamento_id: f.id,
      parcela: i,
      pessoas: f.pessoas,
      data_criacao: f.data_criacao,
    });
  }
  return out;
}

export function valorDevedor(t: FinTransacao, nome: string): number {
  const p = t.pessoas?.find(x => x.nome === nome);
  if (!p) return 0;
  if (p.porcentagem != null) return t.valor * (p.porcentagem / 100);
  return p.valor ?? 0;
}

export function agregarDevedores(transacoes: FinTransacao[]) {
  const map = new Map<string, { nome: string; total: number; itens: { transacao: FinTransacao; valor: number }[] }>();
  for (const t of transacoes) {
    if (!t.pessoas?.length) continue;
    for (const p of t.pessoas) {
      if (!p.nome.trim()) continue;
      if (t.pessoas_quitadas?.includes(p.nome)) continue;
      const v = valorDevedor(t, p.nome);
      if (v <= 0) continue;
      const cur = map.get(p.nome) ?? { nome: p.nome, total: 0, itens: [] };
      cur.total += v;
      cur.itens.push({ transacao: t, valor: v });
      map.set(p.nome, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

// Receitas virtuais "Devedor" geradas a partir de despesas com pessoas (uma por pessoa+mês)
export function gerarReceitasDevedores(transacoes: FinTransacao[]): FinTransacao[] {
  const map = new Map<string, FinTransacao>(); // key: pessoa|mes
  for (const t of transacoes) {
    if (t.movimento !== 'DESPESA' || !t.pessoas?.length) continue;
    for (const p of t.pessoas) {
      if (!p.nome.trim()) continue;
      const quitada = t.pessoas_quitadas?.includes(p.nome);
      const v = valorDevedor(t, p.nome);
      if (v <= 0) continue;
      const mes = mesDeData(t.data);
      const key = `${p.nome}|${mes}`;
      const id = `dev-${p.nome.replace(/\s+/g, '_')}-${mes}`;
      const cur = map.get(key);
      if (cur) {
        cur.valor += v;
        if (quitada) cur.pago = true; // pago se TODAS estão quitadas — simplificação: marca como pago se alguma o for
      } else {
        map.set(key, {
          id,
          data: `${mes}-01`,
          descricao: `Devedor: ${p.nome}`,
          movimento: 'RECEITA',
          categoria_id: CATEGORIA_DEVEDOR_ID,
          conta_id: t.conta_id,
          valor: v,
          pago: !!quitada,
          data_criacao: t.data_criacao,
        });
      }
    }
  }
  return [...map.values()];
}

export function expandirFixas(transacoes: FinTransacao[], mes: string): FinTransacao[] {
  const out: FinTransacao[] = [];
  const [y, m] = mes.split('-').map(Number);
  for (const t of transacoes) {
    if (!t.fixa) continue;
    if (mesDeData(t.data) >= mes) continue;
    const orig = new Date(t.data);
    const novaData = new Date(y, m - 1, Math.min(orig.getDate(), 28));
    const dataStr = `${novaData.getFullYear()}-${String(novaData.getMonth() + 1).padStart(2, '0')}-${String(novaData.getDate()).padStart(2, '0')}`;
    const id = `fix-${t.id}-${mes}`;
    if (transacoes.some(r => r.id === id)) continue;
    out.push({ ...t, id, data: dataStr, pago: false, fixa: true });
  }
  return out;
}

// Compõe transações reais + financiamentos virtuais — DEDUPE por (financiamento_id, parcela)
export function transacoesComFinanciamentos(
  transacoes: FinTransacao[],
  financiamentos: FinFinanciamento[],
): FinTransacao[] {
  const realKeys = new Set<string>();
  for (const t of transacoes) {
    if (t.financiamento_id && t.parcela != null) {
      realKeys.add(`${t.financiamento_id}-${t.parcela}`);
    }
  }
  const virt: FinTransacao[] = [];
  for (const f of financiamentos) {
    for (const t of gerarTransacoesFinanciamento(f)) {
      const k = `${f.id}-${t.parcela}`;
      if (!realKeys.has(k)) virt.push(t);
    }
  }
  return [...transacoes, ...virt];
}

export function todasComProjecao(
  transacoes: FinTransacao[],
  financiamentos: FinFinanciamento[],
  mes: string,
): FinTransacao[] {
  const base = transacoesComFinanciamentos(transacoes, financiamentos);
  const fixas = expandirFixas(transacoes, mes);
  const devedores = gerarReceitasDevedores(base);
  return [...base, ...fixas, ...devedores];
}

// Saldo com filtro opcional até data limite (inclusive)
export function saldoConta(
  conta: FinConta,
  transacoes: FinTransacao[],
  incluirPrevistos = false,
  ateData?: string,
): number {
  const movs = transacoes.filter(t => {
    if (t.conta_id !== conta.id) return false;
    if (!incluirPrevistos && !t.pago) return false;
    if (ateData && t.data > ateData) return false;
    return true;
  });
  const delta = movs.reduce((s, t) => s + (t.movimento === 'RECEITA' ? t.valor : -t.valor), 0);
  return conta.saldo_inicial + delta;
}
