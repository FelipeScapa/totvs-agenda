import { useMemo, useState, useEffect } from 'react';
import { useFinTransacoes, useFinContas, useFinCategorias, useFinTipos, useFinFinanciamentos } from '@/hooks/use-financeiro';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MesSelector } from './MesSelector';
import { MultiSelect } from '@/components/MultiSelect';
import { PessoasEditor } from './PessoasEditor';
import { CurrencyInput } from './CurrencyInput';
import { fmtBRL, mesAtual, mesDeData, todasComProjecao, saldoConta } from '@/lib/financeiro-utils';
import { FinTransacao, FinTipoMov } from '@/types/financeiro';
import { Plus, MoreVertical, X, Wallet, TrendingUp, TrendingDown, Scale, Filter, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2, Repeat, Users, RotateCcw, Hourglass, Receipt } from 'lucide-react';

interface Props {
  movimentoInicial?: FinTipoMov | null;
  mesInicial?: string;
  onAbrirContas?: () => void;
}

type SortKey = 'data' | 'descricao' | 'categoria' | 'tipo' | 'conta' | 'valor' | 'status';

export function FinTransacoesView({ movimentoInicial = null, mesInicial, onAbrirContas }: Props) {
  const { transacoes, add, update, remove } = useFinTransacoes();
  const { contas } = useFinContas();
  const { categorias } = useFinCategorias();
  const { tipos } = useFinTipos();
  const { financiamentos } = useFinFinanciamentos();

  const [mes, setMes] = useState(mesInicial ?? mesAtual());
  useEffect(() => { if (mesInicial) setMes(mesInicial); }, [mesInicial]);

  // Filtro movimento principal (controla cards e botão)
  const [movFiltro, setMovFiltro] = useState<FinTipoMov | null>(movimentoInicial);
  useEffect(() => { if (movimentoInicial) setMovFiltro(movimentoInicial); }, [movimentoInicial]);

  const [filtros, setFiltros] = useState<{ categorias: string[]; contas: string[]; tipos: string[]; status: string[] }>({
    categorias: [], contas: [], tipos: [], status: [],
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinTransacao | null>(null);
  const [efetivar, setEfetivar] = useState<FinTransacao | null>(null);
  const [estorno, setEstorno] = useState<FinTransacao | null>(null);
  const [scopeDialog, setScopeDialog] = useState<{ trans: FinTransacao; patch: Omit<FinTransacao, 'id' | 'data_criacao'> } | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('data');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [totalizadores, setTotalizadores] = useState(true);
  const [novoMovimento, setNovoMovimento] = useState<FinTipoMov>('DESPESA');

  const todas = useMemo(() => todasComProjecao(transacoes, financiamentos, mes), [transacoes, financiamentos, mes]);
  const doMes = useMemo(() => todas.filter(t => mesDeData(t.data) === mes), [todas, mes]);

  const filtradas = useMemo(() => {
    const list = doMes.filter(t => {
      if (movFiltro && t.movimento !== movFiltro) return false;
      if (filtros.categorias.length && !filtros.categorias.includes(t.categoria_id)) return false;
      if (filtros.contas.length && !filtros.contas.includes(t.conta_id)) return false;
      if (filtros.tipos.length && !filtros.tipos.includes(t.tipo_id ?? '')) return false;
      if (filtros.status.length && !filtros.status.includes(t.pago ? 'PAGO' : 'PENDENTE')) return false;
      return true;
    });
    const get = (t: FinTransacao): string | number => {
      switch (sortKey) {
        case 'descricao': return t.descricao.toLowerCase();
        case 'categoria': return categorias.find(c => c.id === t.categoria_id)?.nome.toLowerCase() ?? '';
        case 'tipo': return tipos.find(p => p.id === t.tipo_id)?.nome.toLowerCase() ?? '';
        case 'conta': return contas.find(c => c.id === t.conta_id)?.nome.toLowerCase() ?? '';
        case 'valor': return t.valor;
        case 'status': return t.pago ? 1 : 0;
        default: return t.data;
      }
    };
    return list.sort((a, b) => {
      const va = get(a), vb = get(b);
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [doMes, movFiltro, filtros, sortKey, sortDir, categorias, tipos, contas]);

  // Totais em cards
  const totais = useMemo(() => {
    const valorAtual = contas.filter(c => c.somar_no_total).reduce((s, c) => s + saldoConta(c, transacoes), 0);
    const baseMov = (mov: FinTipoMov) => doMes.filter(t => t.movimento === mov);
    const r = baseMov('RECEITA');
    const d = baseMov('DESPESA');
    return {
      valorAtual,
      receita: { efetivado: r.filter(t => t.pago).reduce((s, t) => s + t.valor, 0), previsto: r.reduce((s, t) => s + t.valor, 0), pendente: r.filter(t => !t.pago).reduce((s, t) => s + t.valor, 0), count: r.length },
      despesa: { efetivado: d.filter(t => t.pago).reduce((s, t) => s + t.valor, 0), previsto: d.reduce((s, t) => s + t.valor, 0), pendente: d.filter(t => !t.pago).reduce((s, t) => s + t.valor, 0), count: d.length },
    };
  }, [doMes, contas, transacoes]);

  const limparFiltros = () => { setFiltros({ categorias: [], contas: [], tipos: [], status: [] }); setMovFiltro(null); };
  const algumFiltroAtivo = !!movFiltro || filtros.categorias.length || filtros.contas.length || filtros.tipos.length || filtros.status.length;

  // Categorias filtradas pelo movimento ativo
  const categoriasFiltro = movFiltro ? categorias.filter(c => c.movimento === movFiltro) : categorias;

  const novoLancamento = (mov?: FinTipoMov) => {
    setEditing(null);
    setNovoMovimento(mov ?? movFiltro ?? 'DESPESA');
    setOpen(true);
  };

  const handleSave = (t: Omit<FinTransacao, 'id' | 'data_criacao'>, novo = false) => {
    if (editing) {
      // Edição de fixa ou financiamento — perguntar escopo se aplicável
      if ((editing.fixa || editing.financiamento_id) && transacoes.some(r => r.id === editing.id)) {
        // já é real — pergunta escopo
        setScopeDialog({ trans: editing, patch: t });
        return;
      }
      update(editing.id, t);
    } else {
      add(t);
    }
    if (!novo) { setOpen(false); setEditing(null); }
  };

  const aplicarEscopo = (escopo: 'esta' | 'pendentes' | 'todas') => {
    if (!scopeDialog) return;
    const { trans, patch } = scopeDialog;
    if (escopo === 'esta') {
      update(trans.id, patch);
    } else if (trans.fixa) {
      // todas as fixas (origem) — atualiza original
      update(trans.id, { ...patch, fixa: true });
    } else if (trans.financiamento_id) {
      const alvos = transacoes.filter(r => r.financiamento_id === trans.financiamento_id && (escopo === 'todas' || !r.pago));
      alvos.forEach(r => update(r.id, { valor: patch.valor, categoria_id: patch.categoria_id, tipo_id: patch.tipo_id, conta_id: patch.conta_id, descricao: patch.descricao }));
    }
    setScopeDialog(null);
    setOpen(false);
    setEditing(null);
  };

  const togglePago = (t: FinTransacao) => {
    if (t.pago) { setEstorno(t); return; }
    setEfetivar(t);
  };

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('asc'); }
  };

  const SortHeader = ({ k, label, align = 'left' }: { k: SortKey; label: string; align?: 'left' | 'right' | 'center' }) => (
    <th className={`p-2 text-${align}`}>
      <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-foreground">
        {label}
        {sortKey === k ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
      </button>
    </th>
  );

  // === Linhas com totalizadores por agrupamento ===
  const groupKey = (t: FinTransacao): string => {
    switch (sortKey) {
      case 'data': return t.data;
      case 'status': return t.pago ? 'Pago' : 'Pendente';
      case 'conta': return contas.find(c => c.id === t.conta_id)?.nome ?? '—';
      case 'tipo': return tipos.find(p => p.id === t.tipo_id)?.nome ?? '—';
      case 'categoria': return categorias.find(c => c.id === t.categoria_id)?.nome ?? '—';
      case 'valor': return ''; // tratado abaixo
      default: return '';
    }
  };

  type Row = { kind: 'sep'; label: string; resumo: string } | { kind: 'item'; t: FinTransacao };
  const linhas = useMemo<Row[]>(() => {
    if (!totalizadores || sortKey === 'descricao') return filtradas.map(t => ({ kind: 'item', t }));
    const out: Row[] = [];
    if (sortKey === 'valor') {
      const pos = filtradas.filter(t => t.movimento === 'RECEITA');
      const neg = filtradas.filter(t => t.movimento === 'DESPESA');
      const sum = (l: FinTransacao[]) => l.reduce((s, t) => s + t.valor, 0);
      if (pos.length) { out.push({ kind: 'sep', label: 'Receitas', resumo: `+ ${fmtBRL(sum(pos))}` }); pos.forEach(t => out.push({ kind: 'item', t })); }
      if (neg.length) { out.push({ kind: 'sep', label: 'Despesas', resumo: `− ${fmtBRL(sum(neg))}` }); neg.forEach(t => out.push({ kind: 'item', t })); }
      return out;
    }
    let cur: string | null = null;
    let buffer: FinTransacao[] = [];
    const flush = () => {
      if (!buffer.length) return;
      const rec = buffer.filter(t => t.movimento === 'RECEITA').reduce((s, t) => s + t.valor, 0);
      const desp = buffer.filter(t => t.movimento === 'DESPESA').reduce((s, t) => s + t.valor, 0);
      let resumo = '';
      switch (sortKey) {
        case 'data': resumo = `Recebido ${fmtBRL(rec)} • Gasto ${fmtBRL(desp)} • Total ${fmtBRL(rec - desp)}`; break;
        case 'status': {
          const total = buffer.reduce((s, t) => s + (t.movimento === 'RECEITA' ? t.valor : -t.valor), 0);
          resumo = `${fmtBRL(total)} (${buffer.length})`; break;
        }
        case 'conta': resumo = `Receita ${fmtBRL(rec)} • Despesa ${fmtBRL(desp)}`; break;
        case 'tipo':
        case 'categoria': resumo = `${fmtBRL(desp + rec)} (${buffer.length})`; break;
      }
      out.push({ kind: 'sep', label: sortKey === 'data' ? buffer[0].data.split('-').reverse().join('/') : cur ?? '', resumo });
      buffer.forEach(t => out.push({ kind: 'item', t }));
      buffer = [];
    };
    filtradas.forEach(t => {
      const k = groupKey(t);
      if (k !== cur) { flush(); cur = k; }
      buffer.push(t);
    });
    flush();
    return out;
  }, [filtradas, totalizadores, sortKey, contas, tipos, categorias]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <MesSelector mes={mes} onChange={setMes} />
        <Button onClick={() => novoLancamento()} size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> {movFiltro === 'RECEITA' ? '+ Nova Receita' : movFiltro === 'DESPESA' ? '+ Nova Despesa' : 'Nova transação'}
        </Button>
      </div>

      {/* Cards — alternam quando há movimento filtrado */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button onClick={onAbrirContas} className="glass-card p-4 space-y-1 text-left hover:ring-2 hover:ring-primary transition">
          <div className="flex items-center gap-2"><Wallet className="w-4 h-4" /><span className="text-xs uppercase tracking-wider text-muted-foreground">Valor atual</span></div>
          <p className="text-2xl font-bold">{fmtBRL(totais.valorAtual)}</p>
          <p className="text-[10px] text-muted-foreground">clique p/ contas</p>
        </button>

        {!movFiltro && <>
          <CardClick icon={TrendingUp} label="Receita" value={totais.receita.efetivado} prev={totais.receita.previsto} color="text-emerald-400" ring="hover:ring-emerald-500" onClick={() => setMovFiltro('RECEITA')} />
          <CardClick icon={TrendingDown} label="Despesa" value={totais.despesa.efetivado} prev={totais.despesa.previsto} color="text-rose-400" ring="hover:ring-rose-500" onClick={() => setMovFiltro('DESPESA')} />
          <div className="glass-card p-4 space-y-1">
            <div className="flex items-center gap-2"><Scale className="w-4 h-4" /><span className="text-xs uppercase tracking-wider text-muted-foreground">Balanço</span></div>
            <p className={`text-2xl font-bold ${totais.receita.efetivado - totais.despesa.efetivado >= 0 ? 'text-primary' : 'text-destructive'}`}>{fmtBRL(totais.receita.efetivado - totais.despesa.efetivado)}</p>
            <p className="text-sm font-semibold text-muted-foreground">prev: {fmtBRL(totais.receita.previsto - totais.despesa.previsto)}</p>
          </div>
        </>}

        {movFiltro === 'RECEITA' && <>
          <CardSimple icon={Hourglass} label="Pendentes" value={totais.receita.pendente} color="text-amber-400" />
          <CardSimple icon={CheckCircle2} label="Recebidas" value={totais.receita.efetivado} color="text-emerald-400" />
          <CardSimple icon={Receipt} label="Total Receitas" value={totais.receita.previsto} color="text-foreground" sub={`${totais.receita.count} lançamento(s)`} />
        </>}

        {movFiltro === 'DESPESA' && <>
          <CardSimple icon={Hourglass} label="Pendentes" value={totais.despesa.pendente} color="text-amber-400" />
          <CardSimple icon={CheckCircle2} label="Pagas" value={totais.despesa.efetivado} color="text-emerald-400" />
          <CardSimple icon={Receipt} label="Total Despesas" value={totais.despesa.previsto} color="text-rose-400" sub={`${totais.despesa.count} lançamento(s)`} />
        </>}
      </div>

      <div className="glass-card p-3 flex items-center gap-2 flex-wrap">
        <Filter className="w-3 h-3 text-muted-foreground" />
        {!movFiltro && (
          <MultiSelect options={[{ value: 'RECEITA', label: 'Receita' }, { value: 'DESPESA', label: 'Despesa' }]} selected={[]} onChange={v => setMovFiltro((v[0] as FinTipoMov) ?? null)} placeholder="Movimento" className="w-32" />
        )}
        {movFiltro && (
          <button onClick={() => setMovFiltro(null)} className={`text-xs px-2 py-1 rounded-md inline-flex items-center gap-1 ${movFiltro === 'RECEITA' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {movFiltro === 'RECEITA' ? 'Receitas' : 'Despesas'} <X className="w-3 h-3" />
          </button>
        )}
        <MultiSelect options={categoriasFiltro.map(c => ({ value: c.id, label: c.nome }))} selected={filtros.categorias} onChange={v => setFiltros({ ...filtros, categorias: v })} placeholder="Categorias" className="w-40" />
        <MultiSelect options={contas.map(c => ({ value: c.id, label: c.nome }))} selected={filtros.contas} onChange={v => setFiltros({ ...filtros, contas: v })} placeholder="Contas" className="w-36" />
        {movFiltro !== 'RECEITA' && (
          <MultiSelect options={tipos.map(t => ({ value: t.id, label: t.nome }))} selected={filtros.tipos} onChange={v => setFiltros({ ...filtros, tipos: v })} placeholder="Tipos" className="w-36" />
        )}
        <MultiSelect options={[{ value: 'PAGO', label: 'Pago' }, { value: 'PENDENTE', label: 'Pendente' }]} selected={filtros.status} onChange={v => setFiltros({ ...filtros, status: v })} placeholder="Status" className="w-32" />
        {algumFiltroAtivo && <Button variant="ghost" size="sm" onClick={limparFiltros} className="h-8"><X className="w-3 h-3 mr-1" /> Limpar</Button>}
        <div className="ml-auto flex items-center gap-2">
          <Switch id="totaliz" checked={totalizadores} onCheckedChange={setTotalizadores} />
          <Label htmlFor="totaliz" className="text-xs cursor-pointer">Totalizadores</Label>
        </div>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground border-b border-border">
            <tr>
              <SortHeader k="data" label="Data" />
              <SortHeader k="descricao" label="Descrição" />
              <SortHeader k="categoria" label="Categoria" />
              {movFiltro !== 'RECEITA' && <SortHeader k="tipo" label="Tipo" />}
              <SortHeader k="conta" label="Conta" />
              <SortHeader k="valor" label="Valor" align="right" />
              <SortHeader k="status" label="Status" align="center" />
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-center text-muted-foreground text-sm">Nenhuma transação no filtro.</td></tr>
            )}
            {linhas.map((row, idx) => {
              if (row.kind === 'sep') {
                return (
                  <tr key={`sep-${idx}`} className="bg-accent/30 text-xs">
                    <td colSpan={8} className="p-2 font-medium flex justify-between">
                      <span className="text-foreground">{row.label}</span>
                      <span className="text-muted-foreground">{row.resumo}</span>
                    </td>
                  </tr>
                );
              }
              const t = row.t;
              const cat = categorias.find(c => c.id === t.categoria_id);
              const tipo = tipos.find(p => p.id === t.tipo_id);
              const conta = contas.find(c => c.id === t.conta_id);
              const isVirt = !transacoes.some(r => r.id === t.id);
              return (
                <tr key={t.id} className="border-b border-border/30 hover:bg-accent/40">
                  <td className="p-2 font-mono text-xs">{t.data.split('-').reverse().join('/')}</td>
                  <td className="p-2">
                    {t.descricao}
                    {isVirt && t.financiamento_id && <span className="text-[10px] text-muted-foreground ml-1">(financ.)</span>}
                    {t.fixa && <span className="text-[10px] text-amber-400 ml-1 inline-flex items-center gap-0.5"><Repeat className="w-2.5 h-2.5" />fixa</span>}
                    {t.pessoas && t.pessoas.length > 0 && <span className="text-[10px] text-cyan-400 ml-1 inline-flex items-center gap-0.5" title={`${t.pessoas.length} devedor(es)`}><Users className="w-2.5 h-2.5" />{t.pessoas.length}</span>}
                  </td>
                  <td className="p-2">{cat?.nome ?? (t.categoria_id === 'devedor' ? 'Devedor' : '—')}</td>
                  {movFiltro !== 'RECEITA' && <td className="p-2 text-muted-foreground">{tipo?.nome ?? '—'}</td>}
                  <td className="p-2 text-muted-foreground">{conta?.nome ?? '—'}</td>
                  <td className={`p-2 text-right font-medium ${t.movimento === 'RECEITA' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.movimento === 'RECEITA' ? '+' : '−'} {fmtBRL(t.valor)}
                  </td>
                  <td className="p-2 text-center">
                    <button onClick={() => togglePago(t)} className={`text-[10px] px-2 py-0.5 rounded ${t.pago ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {t.pago ? 'Pago' : 'Pagar'}
                    </button>
                  </td>
                  <td className="p-2 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditing(isVirt ? null : t); setNovoMovimento(t.movimento); setOpen(true); }}>Editar</DropdownMenuItem>
                        {!isVirt && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive">Excluir</DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
                                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => remove(t.id)}>Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <TransacaoForm
        key={editing?.id ?? `novo-${novoMovimento}`}
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}
        editing={editing}
        movimentoInicial={novoMovimento}
        onSave={handleSave}
      />

      <EfetivarDialog
        title="Efetivar / Pagar"
        transacao={efetivar}
        onClose={() => setEfetivar(null)}
        onConfirm={(patch) => {
          if (!efetivar) return;
          const isReal = transacoes.some(r => r.id === efetivar.id);
          if (isReal) update(efetivar.id, { ...patch, pago: true });
          else { const { id, data_criacao, ...rest } = efetivar; add({ ...rest, ...patch, pago: true }); }
          setEfetivar(null);
        }}
      />

      <EstornoDialog
        transacao={estorno}
        onClose={() => setEstorno(null)}
        onConfirm={() => {
          if (!estorno) return;
          const isReal = transacoes.some(r => r.id === estorno.id);
          if (isReal) update(estorno.id, { pago: false });
          else { const { id, data_criacao, ...rest } = estorno; add({ ...rest, pago: false }); }
          setEstorno(null);
        }}
      />

      <ScopeDialog
        open={!!scopeDialog}
        kind={scopeDialog?.trans.financiamento_id ? 'financiamento' : 'fixa'}
        onClose={() => setScopeDialog(null)}
        onApply={aplicarEscopo}
      />
    </div>
  );
}

function CardClick({ icon: Icon, label, value, prev, color, ring, onClick }: { icon: any; label: string; value: number; prev: number; color: string; ring: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`glass-card p-4 space-y-1 text-left transition hover:ring-2 ${ring}`}>
      <div className="flex items-center gap-2"><Icon className={`w-4 h-4 ${color}`} /><span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span></div>
      <p className={`text-2xl font-bold ${color}`}>{fmtBRL(value)}</p>
      <p className="text-sm font-semibold text-muted-foreground">prev: {fmtBRL(prev)}</p>
    </button>
  );
}
function CardSimple({ icon: Icon, label, value, color, sub }: { icon: any; label: string; value: number; color: string; sub?: string }) {
  return (
    <div className="glass-card p-4 space-y-1">
      <div className="flex items-center gap-2"><Icon className={`w-4 h-4 ${color}`} /><span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span></div>
      <p className={`text-2xl font-bold ${color}`}>{fmtBRL(value)}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function TransacaoForm({ open, onOpenChange, editing, movimentoInicial, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; editing: FinTransacao | null; movimentoInicial: FinTipoMov; onSave: (t: Omit<FinTransacao, 'id' | 'data_criacao'>, novo?: boolean) => void }) {
  const { contas } = useFinContas();
  const { categorias } = useFinCategorias();
  const { tipos } = useFinTipos();
  const empty = (): Omit<FinTransacao, 'id' | 'data_criacao'> => ({
    data: new Date().toISOString().slice(0, 10),
    descricao: '', movimento: movimentoInicial, categoria_id: '', tipo_id: '', conta_id: contas[0]?.id ?? '', valor: 0, pago: true, fixa: false, pessoas: [],
  });
  const [form, setForm] = useState<Omit<FinTransacao, 'id' | 'data_criacao'>>(empty());
  const [modoPess, setModoPess] = useState<'percentual' | 'valor'>('percentual');

  useEffect(() => {
    if (editing && editing.id) {
      const { id, data_criacao, ...rest } = editing;
      setForm(rest);
    } else {
      setForm(empty());
    }
  }, [editing, open, movimentoInicial]);

  const catsFiltradas = categorias.filter(c => c.movimento === form.movimento);
  const valid = form.descricao.trim() && form.conta_id && form.categoria_id;

  const submit = (novo: boolean) => {
    onSave(form, novo);
    if (novo) setForm(empty());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{editing?.id ? 'Editar transação' : `Nova ${form.movimento === 'RECEITA' ? 'receita' : 'despesa'}`}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Movimento</Label>
              <Select value={form.movimento} onValueChange={v => setForm({ ...form, movimento: v as FinTipoMov, categoria_id: '', tipo_id: v === 'RECEITA' ? '' : form.tipo_id })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DESPESA">Despesa</SelectItem>
                  <SelectItem value="RECEITA">Receita</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data</Label>
              <Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Descrição</Label>
            <Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select value={form.categoria_id || ''} onValueChange={v => {
                const cat = categorias.find(c => c.id === v);
                setForm({ ...form, categoria_id: v, tipo_id: cat?.tipo_id ?? form.tipo_id });
              }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {catsFiltradas.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.movimento === 'DESPESA' && (
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo_id || ''} onValueChange={v => setForm({ ...form, tipo_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {tipos.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Conta</Label>
              <Select value={form.conta_id || ''} onValueChange={v => setForm({ ...form, conta_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {contas.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor</Label>
              <CurrencyInput value={form.valor} onChange={v => setForm({ ...form, valor: v })} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.pago} onCheckedChange={v => setForm({ ...form, pago: !!v })} />
              Pago / efetivado
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={!!form.fixa} onCheckedChange={v => setForm({ ...form, fixa: !!v })} />
              Fixa (repete todo mês)
            </label>
          </div>
          {form.movimento === 'DESPESA' && (
            <PessoasEditor valorTotal={form.valor} modo={modoPess} onModoChange={setModoPess} pessoas={form.pessoas ?? []} onChange={ps => setForm({ ...form, pessoas: ps })} />
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {!editing?.id && (
            <Button variant="secondary" onClick={() => submit(true)} disabled={!valid}>Salvar + incluir outra</Button>
          )}
          <Button onClick={() => submit(false)} disabled={!valid}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EfetivarDialog({ title, transacao, onClose, onConfirm }: { title: string; transacao: FinTransacao | null; onClose: () => void; onConfirm: (patch: { valor: number; data: string; conta_id: string }) => void }) {
  const { contas } = useFinContas();
  const [valor, setValor] = useState(0);
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [conta, setConta] = useState('');
  useEffect(() => {
    if (transacao) { setValor(transacao.valor); setData(new Date().toISOString().slice(0, 10)); setConta(transacao.conta_id); }
  }, [transacao]);
  return (
    <Dialog open={!!transacao} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{transacao?.descricao}</p>
          <div><Label>Valor</Label><CurrencyInput value={valor} onChange={setValor} /></div>
          <div><Label>Data</Label><Input type="date" value={data} onChange={e => setData(e.target.value)} /></div>
          <div>
            <Label>Conta</Label>
            <Select value={conta} onValueChange={setConta}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{contas.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onConfirm({ valor, data, conta_id: conta })}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EstornoDialog({ transacao, onClose, onConfirm }: { transacao: FinTransacao | null; onClose: () => void; onConfirm: () => void }) {
  return (
    <AlertDialog open={!!transacao} onOpenChange={v => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Estornar pagamento?</AlertDialogTitle>
          <AlertDialogDescription>
            {transacao?.descricao} — {transacao && fmtBRL(transacao.valor)}<br />
            A transação voltará para o status <strong>Pendente</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Estornar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ScopeDialog({ open, kind, onClose, onApply }: { open: boolean; kind: 'fixa' | 'financiamento'; onClose: () => void; onApply: (e: 'esta' | 'pendentes' | 'todas') => void }) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Aplicar alteração em quais lançamentos?</DialogTitle></DialogHeader>
        <div className="space-y-2 text-sm">
          <Button variant="outline" className="w-full justify-start" onClick={() => onApply('esta')}>Somente esta</Button>
          {kind === 'financiamento' && <Button variant="outline" className="w-full justify-start" onClick={() => onApply('pendentes')}>Esta e todas as pendentes</Button>}
          {kind === 'financiamento' && <Button variant="outline" className="w-full justify-start" onClick={() => onApply('todas')}>Todas (incluindo já pagas)</Button>}
          {kind === 'fixa' && <Button variant="outline" className="w-full justify-start" onClick={() => onApply('todas')}>Todas as ocorrências futuras (atualiza a fixa)</Button>}
        </div>
        <DialogFooter><Button variant="ghost" onClick={onClose}>Cancelar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
