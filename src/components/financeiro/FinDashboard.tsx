import { useMemo, useState } from 'react';
import { useFinTransacoes, useFinContas, useFinCategorias, useFinTipos, useFinLimites, useFinDivisao, useFinFinanciamentos } from '@/hooks/use-financeiro';
import { fmtBRL, mesAtual, mesDeData, transacoesComFinanciamentos, saldoConta } from '@/lib/financeiro-utils';
import { MesSelector } from './MesSelector';
import { Wallet, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { FinTipoMov } from '@/types/financeiro';

interface Props {
  onAbrirContas: () => void;
  onAbrirTransacoes: (mov: FinTipoMov, mes: string) => void;
}

export function FinDashboard({ onAbrirContas, onAbrirTransacoes }: Props) {
  const [mes, setMes] = useState(mesAtual());
  const { transacoes } = useFinTransacoes();
  const { contas } = useFinContas();
  const { categorias } = useFinCategorias();
  const { tipos } = useFinTipos();
  const { limites } = useFinLimites();
  const { divisao } = useFinDivisao();
  const { financiamentos } = useFinFinanciamentos();

  const todas = useMemo(() => transacoesComFinanciamentos(transacoes, financiamentos), [transacoes, financiamentos]);
  const doMes = useMemo(() => todas.filter(t => mesDeData(t.data) === mes && t.pago), [todas, mes]);

  const valorAtual = contas.filter(c => c.somar_no_total).reduce((s, c) => s + saldoConta(c, transacoes), 0);
  const totalReceita = doMes.filter(t => t.movimento === 'RECEITA').reduce((s, t) => s + t.valor, 0);
  const totalDespesa = doMes.filter(t => t.movimento === 'DESPESA').reduce((s, t) => s + t.valor, 0);
  const balanco = totalReceita - totalDespesa;

  // Por categoria
  const agruparPorCategoria = (mov: FinTipoMov) => {
    const map = new Map<string, number>();
    doMes.filter(t => t.movimento === mov).forEach(t => {
      const cat = categorias.find(c => c.id === t.categoria_id);
      const root = cat?.parent_id ? categorias.find(c => c.id === cat.parent_id) : cat;
      const key = root?.id ?? '__sem__';
      map.set(key, (map.get(key) ?? 0) + t.valor);
    });
    return [...map.entries()]
      .map(([id, v]) => ({ id, nome: categorias.find(c => c.id === id)?.nome ?? 'Sem categoria', valor: v }))
      .sort((a, b) => b.valor - a.valor);
  };
  const porCatDespesa = agruparPorCategoria('DESPESA');
  const porCatReceita = agruparPorCategoria('RECEITA');

  // Por tipo (despesas)
  const porTipo = useMemo(() => {
    const map = new Map<string, number>();
    doMes.filter(t => t.movimento === 'DESPESA').forEach(t => {
      const k = t.tipo_id || '__sem__';
      map.set(k, (map.get(k) ?? 0) + t.valor);
    });
    const ganhosBase = doMes.filter(t => {
      if (t.movimento !== 'RECEITA') return false;
      const cat = categorias.find(c => c.id === t.categoria_id);
      return cat?.somar_nos_ganhos !== false;
    }).reduce((s, t) => s + t.valor, 0);
    return tipos.map(t => {
      const gasto = map.get(t.id) ?? 0;
      const pct = divisao.porcentagens[t.id] ?? 0;
      const meta = ganhosBase * (pct / 100);
      return { tipo: t, gasto, meta, pct, ganhosBase };
    });
  }, [doMes, tipos, divisao, categorias]);

  // Limites
  const limitesMes = limites.filter(l => l.mes === mes);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <MesSelector mes={mes} onChange={setMes} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button onClick={onAbrirContas} className="glass-card p-4 text-left hover:ring-2 hover:ring-primary transition">
          <div className="flex items-center gap-2"><Wallet className="w-4 h-4" /><span className="text-xs uppercase text-muted-foreground tracking-wider">Valor atual</span></div>
          <p className="text-2xl font-bold mt-1">{fmtBRL(valorAtual)}</p>
          <p className="text-[10px] text-muted-foreground">ver contas →</p>
        </button>
        <button onClick={() => onAbrirTransacoes('RECEITA', mes)} className="glass-card p-4 text-left hover:ring-2 hover:ring-emerald-500 transition">
          <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" /><span className="text-xs uppercase text-muted-foreground tracking-wider">Receita</span></div>
          <p className="text-2xl font-bold mt-1 text-emerald-400">{fmtBRL(totalReceita)}</p>
        </button>
        <button onClick={() => onAbrirTransacoes('DESPESA', mes)} className="glass-card p-4 text-left hover:ring-2 hover:ring-rose-500 transition">
          <div className="flex items-center gap-2"><TrendingDown className="w-4 h-4 text-rose-400" /><span className="text-xs uppercase text-muted-foreground tracking-wider">Despesa</span></div>
          <p className="text-2xl font-bold mt-1 text-rose-400">{fmtBRL(totalDespesa)}</p>
        </button>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2"><Scale className="w-4 h-4" /><span className="text-xs uppercase text-muted-foreground tracking-wider">Balanço</span></div>
          <p className={`text-2xl font-bold mt-1 ${balanco >= 0 ? 'text-primary' : 'text-destructive'}`}>{fmtBRL(balanco)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <BarList titulo="Despesas por categoria" itens={porCatDespesa} total={totalDespesa} cor="rose" />
        <BarList titulo="Receitas por categoria" itens={porCatReceita} total={totalReceita} cor="emerald" />
      </div>

      <div className="glass-card p-4 space-y-3">
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground">Gasto por tipo (Essencial / Qualidade / Investimento)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {porTipo.map(({ tipo, gasto, meta, pct }) => {
            const usoPct = meta > 0 ? Math.min(100, (gasto / meta) * 100) : 0;
            return (
              <div key={tipo.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{tipo.nome} <span className="text-xs text-muted-foreground">({pct}%)</span></span>
                  <span className="text-muted-foreground">{fmtBRL(gasto)} / {fmtBRL(meta)}</span>
                </div>
                <div className="h-2 bg-muted rounded">
                  <div className={`h-full rounded ${usoPct > 100 ? 'bg-destructive' : usoPct > 80 ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${usoPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-card p-4 space-y-3">
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground">Limites por categoria</h3>
        {limitesMes.length === 0 && <p className="text-xs text-muted-foreground">Nenhum limite definido para este mês. Configure em Configurações → Limites.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {limitesMes.map(l => {
            const cat = categorias.find(c => c.id === l.categoria_id);
            const gasto = doMes.filter(t => {
              const tc = categorias.find(c => c.id === t.categoria_id);
              const root = tc?.parent_id ? categorias.find(c => c.id === tc.parent_id) : tc;
              return t.movimento === 'DESPESA' && root?.id === l.categoria_id;
            }).reduce((s, t) => s + t.valor, 0);
            const pct = l.valor > 0 ? Math.min(100, (gasto / l.valor) * 100) : 0;
            return (
              <div key={l.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{cat?.nome ?? '—'}</span>
                  <span className="text-muted-foreground">{fmtBRL(gasto)} / {fmtBRL(l.valor)} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="h-2 bg-muted rounded">
                  <div className={`h-full rounded ${pct >= 100 ? 'bg-destructive' : pct >= 80 ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BarList({ titulo, itens, total, cor }: { titulo: string; itens: { id: string; nome: string; valor: number }[]; total: number; cor: 'rose' | 'emerald' }) {
  const corBar = cor === 'rose' ? 'bg-rose-500' : 'bg-emerald-500';
  return (
    <div className="glass-card p-4 space-y-2">
      <h3 className="text-sm uppercase tracking-wider text-muted-foreground">{titulo}</h3>
      {itens.length === 0 && <p className="text-xs text-muted-foreground">Sem dados.</p>}
      {itens.map(i => {
        const pct = total > 0 ? (i.valor / total) * 100 : 0;
        return (
          <div key={i.id} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{i.nome}</span>
              <span className="text-muted-foreground">{fmtBRL(i.valor)} ({pct.toFixed(0)}%)</span>
            </div>
            <div className="h-1.5 bg-muted rounded">
              <div className={`h-full rounded ${corBar}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
