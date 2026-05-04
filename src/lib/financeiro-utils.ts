import { FinTransacao, FinFinanciamento, FinConta } from '@/types/financeiro';

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

// Gera todas as transações virtuais de um financiamento (passadas e futuras)
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
      pago: i < f.parcela_atual, // parcelas anteriores marcadas como pagas
      financiamento_id: f.id,
      parcela: i,
      data_criacao: f.data_criacao,
    });
  }
  return out;
}

// Expande despesas/receitas fixas para todos os meses ≥ data original
export function expandirFixas(transacoes: FinTransacao[], mes: string): FinTransacao[] {
  const out: FinTransacao[] = [];
  const [y, m] = mes.split('-').map(Number);
  for (const t of transacoes) {
    if (!t.fixa) continue;
    if (mesDeData(t.data) >= mes) continue; // já existe nesse mês ou é futuro relativo
    const orig = new Date(t.data);
    const novaData = new Date(y, m - 1, Math.min(orig.getDate(), 28));
    const dataStr = `${novaData.getFullYear()}-${String(novaData.getMonth() + 1).padStart(2, '0')}-${String(novaData.getDate()).padStart(2, '0')}`;
    const id = `fix-${t.id}-${mes}`;
    if (transacoes.some(r => r.id === id)) continue;
    out.push({ ...t, id, data: dataStr, pago: false, fixa: true });
  }
  return out;
}

// Compõe transações reais + financiamentos virtuais (excluindo IDs já materializados)
export function transacoesComFinanciamentos(
  transacoes: FinTransacao[],
  financiamentos: FinFinanciamento[],
): FinTransacao[] {
  const idsReais = new Set(transacoes.map(t => t.id));
  const virt: FinTransacao[] = [];
  for (const f of financiamentos) {
    for (const t of gerarTransacoesFinanciamento(f)) {
      if (!idsReais.has(t.id)) virt.push(t);
    }
  }
  return [...transacoes, ...virt];
}

// Versão completa: real + financiamentos + fixas projetadas no mês informado
export function todasComProjecao(
  transacoes: FinTransacao[],
  financiamentos: FinFinanciamento[],
  mes: string,
): FinTransacao[] {
  const base = transacoesComFinanciamentos(transacoes, financiamentos);
  const fixas = expandirFixas(transacoes, mes);
  return [...base, ...fixas];
}

export function saldoConta(conta: FinConta, transacoes: FinTransacao[], incluirPrevistos = false): number {
  const movs = transacoes.filter(t => t.conta_id === conta.id && (incluirPrevistos || t.pago));
  const delta = movs.reduce((s, t) => s + (t.movimento === 'RECEITA' ? t.valor : -t.valor), 0);
  return conta.saldo_inicial + delta;
}
