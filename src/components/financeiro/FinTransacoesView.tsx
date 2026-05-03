import { useMemo, useState, useEffect } from 'react';
import { useFinTransacoes, useFinContas, useFinCategorias, useFinTipos, useFinFinanciamentos } from '@/hooks/use-financeiro';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MesSelector } from './MesSelector';
import { MultiSelect } from '@/components/MultiSelect';
import { fmtBRL, mesAtual, mesDeData, transacoesComFinanciamentos, saldoConta } from '@/lib/financeiro-utils';
import { FinTransacao, FinTipoMov } from '@/types/financeiro';
import { Plus, MoreVertical, X, Wallet, TrendingUp, TrendingDown, Scale, Filter } from 'lucide-react';

interface Props {
  movimentoInicial?: FinTipoMov | null;
  mesInicial?: string;
}

export function FinTransacoesView({ movimentoInicial = null, mesInicial }: Props) {
  const { transacoes, add, update, remove } = useFinTransacoes();
  const { contas } = useFinContas();
  const { categorias } = useFinCategorias();
  const { tipos } = useFinTipos();
  const { financiamentos } = useFinFinanciamentos();

  const [mes, setMes] = useState(mesInicial ?? mesAtual());
  useEffect(() => { if (mesInicial) setMes(mesInicial); }, [mesInicial]);

  const [filtros, setFiltros] = useState<{ categorias: string[]; contas: string[]; tipos: string[]; status: string[]; movimento: string[] }>({
    categorias: [], contas: [], tipos: [], status: [], movimento: movimentoInicial ? [movimentoInicial] : [],
  });
  useEffect(() => {
    if (movimentoInicial) setFiltros(f => ({ ...f, movimento: [movimentoInicial] }));
  }, [movimentoInicial]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinTransacao | null>(null);

  const todas = useMemo(() => transacoesComFinanciamentos(transacoes, financiamentos), [transacoes, financiamentos]);

  const doMes = useMemo(() => todas.filter(t => mesDeData(t.data) === mes), [todas, mes]);

  const filtradas = useMemo(() => {
    return doMes.filter(t => {
      if (filtros.movimento.length && !filtros.movimento.includes(t.movimento)) return false;
      if (filtros.categorias.length && !filtros.categorias.includes(t.categoria_id)) return false;
      if (filtros.contas.length && !filtros.contas.includes(t.conta_id)) return false;
      if (filtros.tipos.length && !filtros.tipos.includes(t.tipo_id ?? '')) return false;
      if (filtros.status.length && !filtros.status.includes(t.pago ? 'PAGO' : 'PENDENTE')) return false;
      return true;
    }).sort((a, b) => a.data.localeCompare(b.data));
  }, [doMes, filtros]);

  const totais = useMemo(() => {
    const valorAtual = contas.filter(c => c.somar_no_total).reduce((s, c) => s + saldoConta(c, transacoes), 0);
    const calc = (mov: FinTipoMov) => {
      const list = filtradas.filter(t => t.movimento === mov);
      return {
        efetivado: list.filter(t => t.pago).reduce((s, t) => s + t.valor, 0),
        previsto: list.reduce((s, t) => s + t.valor, 0),
      };
    };
    const r = calc('RECEITA');
    const d = calc('DESPESA');
    return {
      valorAtual,
      receita: r,
      despesa: d,
      balancoEfet: r.efetivado - d.efetivado,
      balancoPrev: r.previsto - d.previsto,
    };
  }, [filtradas, contas, transacoes]);

  const limparFiltros = () => setFiltros({ categorias: [], contas: [], tipos: [], status: [], movimento: [] });

  const handleSave = (t: Omit<FinTransacao, 'id' | 'data_criacao'>) => {
    if (editing) update(editing.id, t);
    else add(t);
    setOpen(false);
    setEditing(null);
  };

  const togglePago = (t: FinTransacao) => {
    if (t.financiamento_id && !transacoes.some(r => r.id === t.id)) {
      // materializar
      add({ ...t, pago: !t.pago } as any);
    } else {
      update(t.id, { pago: !t.pago });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <MesSelector mes={mes} onChange={setMes} />
        <Button onClick={() => { setEditing(null); setOpen(true); }} size="sm" className="gap-1"><Plus className="w-4 h-4" /> Nova transação</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CardTotal icon={Wallet} label="Valor atual" value={totais.valorAtual} sub="contas marcadas no total" color="text-foreground" />
        <CardTotal icon={TrendingUp} label="Receita" value={totais.receita.efetivado} sub={`previsto ${fmtBRL(totais.receita.previsto)}`} color="text-emerald-400" />
        <CardTotal icon={TrendingDown} label="Despesa" value={totais.despesa.efetivado} sub={`previsto ${fmtBRL(totais.despesa.previsto)}`} color="text-rose-400" />
        <CardTotal icon={Scale} label="Balanço" value={totais.balancoEfet} sub={`previsto ${fmtBRL(totais.balancoPrev)}`} color={totais.balancoEfet >= 0 ? 'text-primary' : 'text-destructive'} />
      </div>

      <div className="glass-card p-3 flex items-center gap-2 flex-wrap">
        <Filter className="w-3 h-3 text-muted-foreground" />
        <MultiSelect
          options={[{ value: 'RECEITA', label: 'Receita' }, { value: 'DESPESA', label: 'Despesa' }]}
          selected={filtros.movimento}
          onChange={v => setFiltros({ ...filtros, movimento: v })}
          placeholder="Movimento" className="w-32"
        />
        <MultiSelect
          options={categorias.map(c => ({ value: c.id, label: c.nome }))}
          selected={filtros.categorias}
          onChange={v => setFiltros({ ...filtros, categorias: v })}
          placeholder="Categorias" className="w-40"
        />
        <MultiSelect
          options={contas.map(c => ({ value: c.id, label: c.nome }))}
          selected={filtros.contas}
          onChange={v => setFiltros({ ...filtros, contas: v })}
          placeholder="Contas" className="w-36"
        />
        <MultiSelect
          options={tipos.map(t => ({ value: t.id, label: t.nome }))}
          selected={filtros.tipos}
          onChange={v => setFiltros({ ...filtros, tipos: v })}
          placeholder="Tipos" className="w-36"
        />
        <MultiSelect
          options={[{ value: 'PAGO', label: 'Pago' }, { value: 'PENDENTE', label: 'Pendente' }]}
          selected={filtros.status}
          onChange={v => setFiltros({ ...filtros, status: v })}
          placeholder="Status" className="w-32"
        />
        {(filtros.categorias.length || filtros.contas.length || filtros.tipos.length || filtros.status.length || filtros.movimento.length) ? (
          <Button variant="ghost" size="sm" onClick={limparFiltros} className="h-8"><X className="w-3 h-3 mr-1" /> Limpar</Button>
        ) : null}
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground border-b border-border">
            <tr>
              <th className="text-left p-2">Data</th>
              <th className="text-left p-2">Descrição</th>
              <th className="text-left p-2">Categoria</th>
              <th className="text-left p-2">Tipo</th>
              <th className="text-left p-2">Conta</th>
              <th className="text-right p-2">Valor</th>
              <th className="text-center p-2">Status</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-center text-muted-foreground text-sm">Nenhuma transação no filtro.</td></tr>
            )}
            {filtradas.map(t => {
              const cat = categorias.find(c => c.id === t.categoria_id);
              const tipo = tipos.find(p => p.id === t.tipo_id);
              const conta = contas.find(c => c.id === t.conta_id);
              const isVirt = !transacoes.some(r => r.id === t.id);
              return (
                <tr key={t.id} className="border-b border-border/30 hover:bg-accent/40">
                  <td className="p-2 font-mono text-xs">{t.data.split('-').reverse().join('/')}</td>
                  <td className="p-2">{t.descricao} {isVirt && <span className="text-[10px] text-muted-foreground ml-1">(financ.)</span>}</td>
                  <td className="p-2">{cat?.nome ?? '—'}</td>
                  <td className="p-2 text-muted-foreground">{tipo?.nome ?? '—'}</td>
                  <td className="p-2 text-muted-foreground">{conta?.nome ?? '—'}</td>
                  <td className={`p-2 text-right font-medium ${t.movimento === 'RECEITA' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.movimento === 'RECEITA' ? '+' : '−'} {fmtBRL(t.valor)}
                  </td>
                  <td className="p-2 text-center">
                    <button onClick={() => togglePago(t)} className={`text-[10px] px-2 py-0.5 rounded ${t.pago ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {t.pago ? 'Pago' : 'Pendente'}
                    </button>
                  </td>
                  <td className="p-2 text-center">
                    {!isVirt && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditing(t); setOpen(true); }}>Editar</DropdownMenuItem>
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <TransacaoForm
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}
        editing={editing}
        onSave={handleSave}
      />
    </div>
  );
}

function CardTotal({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: number; sub: string; color: string }) {
  return (
    <div className="glass-card p-4 space-y-1">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{fmtBRL(value)}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function TransacaoForm({ open, onOpenChange, editing, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; editing: FinTransacao | null; onSave: (t: Omit<FinTransacao, 'id' | 'data_criacao'>) => void }) {
  const { contas } = useFinContas();
  const { categorias } = useFinCategorias();
  const { tipos } = useFinTipos();
  const [form, setForm] = useState<Omit<FinTransacao, 'id' | 'data_criacao'>>({
    data: new Date().toISOString().slice(0, 10),
    descricao: '',
    movimento: 'DESPESA',
    categoria_id: '',
    tipo_id: '',
    conta_id: '',
    valor: 0,
    pago: true,
  });

  useEffect(() => {
    if (editing) {
      const { id, data_criacao, ...rest } = editing;
      setForm(rest);
    } else {
      setForm({
        data: new Date().toISOString().slice(0, 10),
        descricao: '', movimento: 'DESPESA', categoria_id: '', tipo_id: '', conta_id: contas[0]?.id ?? '', valor: 0, pago: true,
      });
    }
  }, [editing, open, contas]);

  const catsFiltradas = categorias.filter(c => c.movimento === form.movimento);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{editing ? 'Editar transação' : 'Nova transação'}</DialogTitle></DialogHeader>
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
              <Select value={form.categoria_id || ''} onValueChange={v => setForm({ ...form, categoria_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {catsFiltradas.map(c => <SelectItem key={c.id} value={c.id}>{c.parent_id ? '↳ ' : ''}{c.nome}</SelectItem>)}
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
              <Input type="number" step="0.01" value={form.valor} onChange={e => setForm({ ...form, valor: Number(e.target.value) || 0 })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.pago} onCheckedChange={v => setForm({ ...form, pago: !!v })} />
            Pago / efetivado
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(form)} disabled={!form.descricao.trim() || !form.conta_id}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
