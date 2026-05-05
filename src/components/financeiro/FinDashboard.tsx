import { useMemo, useState } from 'react';
import { useFinTransacoes, useFinContas, useFinCategorias, useFinTipos, useFinLimites, useFinDivisao, useFinFinanciamentos } from '@/hooks/use-financeiro';
import { fmtBRL, mesAtual, mesDeData, todasComProjecao, saldoConta, navegarMes, labelMes, agregarDevedores, transacoesComFinanciamentos } from '@/lib/financeiro-utils';
import { MesSelector } from './MesSelector';
import { Wallet, TrendingUp, TrendingDown, Scale, Eye, EyeOff, Users } from 'lucide-react';
import { FinTipoMov } from '@/types/financeiro';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Props {
  onAbrirContas: () => void;
  onAbrirTransacoes: (mov: FinTipoMov, mes: string) => void;
}

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#ec4899', '#84cc16', '#14b8a6', '#f97316'];

export function FinDashboard({ onAbrirContas, onAbrirTransacoes }: Props) {
  const [mes, setMes] = useState(mesAtual());
  const [previsto, setPrevisto] = useState(false);
  const [ocultar, setOcultar] = useState(false);
  const { transacoes } = useFinTransacoes();
  const { contas } = useFinContas();
  const { categorias } = useFinCategorias();
  const { tipos } = useFinTipos();
  const { limites } = useFinLimites();
  const { divisao } = useFinDivisao();
  const { financiamentos } = useFinFinanciamentos();

  const todas = useMemo(() => todasComProjecao(transacoes, financiamentos, mes), [transacoes, financiamentos, mes]);
  const doMes = useMemo(() => todas.filter(t => mesDeData(t.data) === mes && (previsto || t.pago)), [todas, mes, previsto]);

  const fmt = (v: number) => ocultar ? '••••' : fmtBRL(v);

  const valorAtual = contas.filter(c => c.somar_no_total).reduce((s, c) => s + saldoConta(c, transacoes), 0);
  const valorPrevisto = contas.filter(c => c.somar_no_total).reduce((s, c) => s + saldoConta(c, todas, true), 0);
  const totalReceita = doMes.filter(t => t.movimento === 'RECEITA').reduce((s, t) => s + t.valor, 0);
  const totalDespesa = doMes.filter(t => t.movimento === 'DESPESA').reduce((s, t) => s + t.valor, 0);
  const balanco = totalReceita - totalDespesa;

  const agruparPorCategoria = (mov: FinTipoMov) => {
    const map = new Map<string, number>();
    doMes.filter(t => t.movimento === mov).forEach(t => {
      map.set(t.categoria_id, (map.get(t.categoria_id) ?? 0) + t.valor);
    });
    return [...map.entries()]
      .map(([id, v]) => ({ id, nome: categorias.find(c => c.id === id)?.nome ?? 'Sem categoria', valor: v }))
      .sort((a, b) => b.valor - a.valor);
  };
  const porCatDespesa = agruparPorCategoria('DESPESA');
  const porCatReceita = agruparPorCategoria('RECEITA');

  // Por tipo (despesas)
  const modoDiv = divisao.modo ?? 'percentual';
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
      const v = divisao.porcentagens[t.id] ?? 0;
      const meta = modoDiv === 'percentual' ? ganhosBase * (v / 100) : v;
      return { tipo: t, gasto, meta, valor: v, ganhosBase };
    });
  }, [doMes, tipos, divisao, categorias, modoDiv]);

  const limitesMes = limites.filter(l => l.mes === mes);

  const evolucao = useMemo(() => {
    const out: { mes: string; receita: number; despesa: number; saldo: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const cur = navegarMes(mes, -5 + i);
      const lista = todasComProjecao(transacoes, financiamentos, cur)
        .filter(t => mesDeData(t.data) === cur && (previsto || t.pago));
      const r = lista.filter(t => t.movimento === 'RECEITA').reduce((s, t) => s + t.valor, 0);
      const d = lista.filter(t => t.movimento === 'DESPESA').reduce((s, t) => s + t.valor, 0);
      out.push({ mes: labelMes(cur).slice(0, 3), receita: r, despesa: d, saldo: r - d });
    }
    return out;
  }, [mes, transacoes, financiamentos, previsto]);

  const devedoresAll = useMemo(() => agregarDevedores(transacoesComFinanciamentos(transacoes, financiamentos)), [transacoes, financiamentos]);
  const totalDevedores = devedoresAll.reduce((s, g) => s + g.total, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <MesSelector mes={mes} onChange={setMes} />
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Switch id="prev" checked={previsto} onCheckedChange={setPrevisto} />
            <Label htmlFor="prev" className="text-xs cursor-pointer">Considerar previstos</Label>
          </div>
          <Button variant="outline" size="sm" onClick={() => setOcultar(o => !o)} className="h-8 gap-1">
            {ocultar ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {ocultar ? 'Mostrar' : 'Ocultar'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button onClick={onAbrirContas} className="glass-card p-4 text-left hover:ring-2 hover:ring-primary transition">
          <div className="flex items-center gap-2"><Wallet className="w-4 h-4" /><span className="text-xs uppercase text-muted-foreground tracking-wider">Valor atual</span></div>
          <p className="text-2xl font-bold mt-1">{fmt(valorAtual)}</p>
          <p className="text-[10px] text-muted-foreground">previsto: {fmt(valorPrevisto)}</p>
        </button>
        <button onClick={() => onAbrirTransacoes('RECEITA', mes)} className="glass-card p-4 text-left hover:ring-2 hover:ring-emerald-500 transition">
          <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" /><span className="text-xs uppercase text-muted-foreground tracking-wider">Receita</span></div>
          <p className="text-2xl font-bold mt-1 text-emerald-400">{fmt(totalReceita)}</p>
        </button>
        <button onClick={() => onAbrirTransacoes('DESPESA', mes)} className="glass-card p-4 text-left hover:ring-2 hover:ring-rose-500 transition">
          <div className="flex items-center gap-2"><TrendingDown className="w-4 h-4 text-rose-400" /><span className="text-xs uppercase text-muted-foreground tracking-wider">Despesa</span></div>
          <p className="text-2xl font-bold mt-1 text-rose-400">{fmt(totalDespesa)}</p>
        </button>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2"><Scale className="w-4 h-4" /><span className="text-xs uppercase text-muted-foreground tracking-wider">Balanço</span></div>
          <p className={`text-2xl font-bold mt-1 ${balanco >= 0 ? 'text-primary' : 'text-destructive'}`}>{fmt(balanco)}</p>
        </div>
      </div>

      {/* Cards das contas */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground">Saldos por conta</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {contas.map(c => {
            const atual = saldoConta(c, transacoes);
            const prev = saldoConta(c, todas, true);
            return (
              <button key={c.id} onClick={onAbrirContas} className="rounded-lg border border-border bg-card/40 p-3 text-left hover:ring-2 hover:ring-primary transition">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium truncate">{c.nome}</span>
                  {c.vr && <span className="text-[9px] uppercase px-1 rounded bg-amber-500/20 text-amber-400">VR</span>}
                </div>
                <p className="text-lg font-bold mt-1">{fmt(atual)}</p>
                <p className="text-[10px] text-muted-foreground">previsto: {fmt(prev)}</p>
              </button>
            );
          })}
          {contas.length === 0 && <p className="text-xs text-muted-foreground col-span-full">Nenhuma conta cadastrada.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <PieCard titulo="Despesas por categoria" itens={porCatDespesa} total={totalDespesa} fmt={fmt} />
        <PieCard titulo="Receitas por categoria" itens={porCatReceita} total={totalReceita} fmt={fmt} />
      </div>

      <div className="glass-card p-4 space-y-3">
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground">Gasto por tipo (Essencial / Qualidade / Investimento)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {porTipo.map(({ tipo, gasto, meta, valor }) => {
            const usoPct = meta > 0 ? Math.min(100, (gasto / meta) * 100) : 0;
            return (
              <div key={tipo.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{tipo.nome} <span className="text-xs text-muted-foreground">({modoDiv === 'percentual' ? `${valor}%` : fmtBRL(valor)})</span></span>
                  <span className="text-muted-foreground">{fmt(gasto)} / {fmt(meta)}</span>
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
            const gasto = doMes.filter(t => t.movimento === 'DESPESA' && t.categoria_id === l.categoria_id).reduce((s, t) => s + t.valor, 0);
            const pct = l.valor > 0 ? Math.min(100, (gasto / l.valor) * 100) : 0;
            return (
              <div key={l.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{cat?.nome ?? '—'}</span>
                  <span className="text-muted-foreground">{fmt(gasto)} / {fmt(l.valor)} ({pct.toFixed(0)}%)</span>
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

function PieCard({ titulo, itens, total, fmt }: { titulo: string; itens: { id: string; nome: string; valor: number }[]; total: number; fmt: (v: number) => string }) {
  const data = itens.map((i, idx) => ({ name: i.nome, value: i.valor, fill: PIE_COLORS[idx % PIE_COLORS.length] }));
  return (
    <div className="glass-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground">{titulo}</h3>
        <span className="text-xs text-muted-foreground">Total: {fmt(total)}</span>
      </div>
      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground py-8 text-center">Sem dados.</p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number, n) => [fmt(v), n]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
