import { useState, useMemo, useEffect } from 'react';
import { useFinFinanciamentos, useFinContas, useFinCategorias, useFinTransacoes, useFinTipos } from '@/hooks/use-financeiro';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Trash2, ChevronRight, ArrowLeft, Pencil, MoreVertical, CheckCircle2, Users } from 'lucide-react';
import { fmtBRL, gerarTransacoesFinanciamento, mesAtual } from '@/lib/financeiro-utils';
import { FinFinanciamento, FinTransacao, FinFinanciamentoPessoa } from '@/types/financeiro';
import { PessoasEditor } from './PessoasEditor';

export function FinFinanciamentosView() {
  const { financiamentos, add, update, remove } = useFinFinanciamentos();
  const { contas } = useFinContas();
  const { categorias } = useFinCategorias();
  const { tipos } = useFinTipos();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinFinanciamento | null>(null);
  const [selecionado, setSelecionado] = useState<FinFinanciamento | null>(null);
  const catsDespesa = categorias.filter(c => c.movimento === 'DESPESA');

  const empty = (): Omit<FinFinanciamento, 'id' | 'data_criacao'> => ({
    descricao: '', conta_id: '', categoria_id: '', tipo_id: '', valor_parcela: 0, total_parcelas: 12, parcela_atual: 1, mes_referencia: mesAtual(), dia_vencimento: 5, pessoas: [],
  });
  const [form, setForm] = useState(empty());
  const [modoPess, setModoPess] = useState<'percentual' | 'valor'>('percentual');

  useEffect(() => {
    if (editing) {
      const { id, data_criacao, ...rest } = editing;
      setForm(rest);
    } else setForm(empty());
  }, [editing, open]);

  const salvar = () => {
    if (!form.descricao.trim()) return;
    if (editing) update(editing.id, form);
    else add(form);
    setOpen(false);
    setEditing(null);
  };

  if (selecionado) {
    const atual = financiamentos.find(f => f.id === selecionado.id);
    if (!atual) { setSelecionado(null); return null; }
    return <DetalheFinanciamento f={atual} onBack={() => setSelecionado(null)} onEditFin={() => { setEditing(atual); setOpen(true); }} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm uppercase text-muted-foreground tracking-wider">Financiamentos & Parcelamentos ({financiamentos.length})</h2>
        <Button size="sm" className="gap-1" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="w-4 h-4" /> Novo</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {financiamentos.length === 0 && <div className="glass-card p-6 text-center text-sm text-muted-foreground md:col-span-2">Nenhum financiamento cadastrado.</div>}
        {financiamentos.map(f => {
          const total = f.valor_parcela * f.total_parcelas;
          const parcPagas = Math.max(0, f.parcela_atual - 1);
          const pago = parcPagas * f.valor_parcela;
          const pct = total > 0 ? (pago / total) * 100 : 0;
          const [refY, refM] = f.mes_referencia.split('-').map(Number);
          const fim = new Date(refY, refM - 1 + (f.total_parcelas - f.parcela_atual), 1);
          const fimLabel = fim.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
          return (
            <div key={f.id} className="glass-card p-4 hover:ring-2 hover:ring-primary transition cursor-pointer" onClick={() => setSelecionado(f)}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{f.descricao}</h3>
                  <p className="text-xs text-muted-foreground">Parcela {f.parcela_atual}/{f.total_parcelas} • {fmtBRL(f.valor_parcela)}/mês</p>
                </div>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(f); setOpen(true); }}><Pencil className="w-3 h-3" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="w-3 h-3" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Excluir financiamento?</AlertDialogTitle><AlertDialogDescription>As parcelas previstas deixarão de aparecer.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => remove(f.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{fmtBRL(pago)} pago</span>
                  <span className="text-muted-foreground">{pct.toFixed(0)}% • restante {fmtBRL(total - pago)}</span>
                </div>
                <div className="h-2 bg-muted rounded"><div className="h-full bg-primary rounded" style={{ width: `${pct}%` }} /></div>
                <p className="text-[10px] text-muted-foreground capitalize">previsão de término: {fimLabel}</p>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Editar financiamento' : 'Novo financiamento'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Descrição</Label><Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Ex.: Moto Honda" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor da parcela</Label><Input type="number" step="0.01" value={form.valor_parcela} onChange={e => setForm({ ...form, valor_parcela: Number(e.target.value) || 0 })} /></div>
              <div><Label>Dia de vencimento</Label><Input type="number" min={1} max={28} value={form.dia_vencimento} onChange={e => setForm({ ...form, dia_vencimento: Number(e.target.value) || 1 })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Total de parcelas</Label><Input type="number" min={1} value={form.total_parcelas} onChange={e => setForm({ ...form, total_parcelas: Number(e.target.value) || 1 })} /></div>
              <div><Label>Parcela atual</Label><Input type="number" min={1} value={form.parcela_atual} onChange={e => setForm({ ...form, parcela_atual: Number(e.target.value) || 1 })} /></div>
            </div>
            <div><Label>Mês de referência (parcela atual)</Label><Input type="month" value={form.mes_referencia} onChange={e => setForm({ ...form, mes_referencia: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Conta</Label>
                <Select value={form.conta_id} onValueChange={v => setForm({ ...form, conta_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{contas.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoria_id} onValueChange={v => setForm({ ...form, categoria_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{catsDespesa.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo_id || ''} onValueChange={v => setForm({ ...form, tipo_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{tipos.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <PessoasEditor
              valorTotal={form.valor_parcela}
              modo={modoPess}
              onModoChange={setModoPess}
              pessoas={form.pessoas ?? []}
              onChange={ps => setForm({ ...form, pessoas: ps })}
            />
          </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetalheFinanciamento({ f, onBack, onEditFin }: { f: FinFinanciamento; onBack: () => void; onEditFin: () => void }) {
  const { transacoes, add, update, remove } = useFinTransacoes();
  const { contas } = useFinContas();
  const parcelas = useMemo(() => gerarTransacoesFinanciamento(f), [f]);
  const [editParc, setEditParc] = useState<FinTransacao | null>(null);
  const [efetivar, setEfetivar] = useState<FinTransacao | null>(null);

  const togglePago = (p: FinTransacao) => {
    const real = transacoes.find(r => r.id === p.id);
    if (real) update(real.id, { pago: !real.pago });
    else { const { id, data_criacao, ...rest } = p; add({ ...rest, pago: !p.pago }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1"><ArrowLeft className="w-4 h-4" /> Voltar</Button>
        <Button variant="outline" size="sm" onClick={onEditFin} className="gap-1"><Pencil className="w-3 h-3" /> Editar financiamento</Button>
      </div>
      <h2 className="text-lg font-bold">{f.descricao}</h2>
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground border-b border-border">
            <tr><th className="p-2 text-left">#</th><th className="p-2 text-left">Vencimento</th><th className="p-2 text-right">Valor</th><th className="p-2 text-center">Status</th><th className="w-10"></th></tr>
          </thead>
          <tbody>
            {parcelas.map(p => {
              const real = transacoes.find(r => r.id === p.id);
              const t = real ?? p;
              const conta = contas.find(c => c.id === t.conta_id);
              return (
                <tr key={p.id} className="border-b border-border/30 hover:bg-accent/40">
                  <td className="p-2">{p.parcela}</td>
                  <td className="p-2 font-mono">{t.data.split('-').reverse().join('/')} <span className="text-[10px] text-muted-foreground">{conta?.nome}</span></td>
                  <td className="p-2 text-right">{fmtBRL(t.valor)}</td>
                  <td className="p-2 text-center">
                    <button onClick={() => togglePago(t)} className={`text-[10px] px-2 py-0.5 rounded ${t.pago ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {t.pago ? 'Pago' : 'Pendente'}
                    </button>
                  </td>
                  <td className="p-2 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!t.pago && <DropdownMenuItem onClick={() => setEfetivar(t)} className="gap-2"><CheckCircle2 className="w-3 h-3" /> Efetivar</DropdownMenuItem>}
                        <DropdownMenuItem onClick={() => setEditParc(t)}>Editar parcela</DropdownMenuItem>
                        {real && <DropdownMenuItem className="text-destructive" onClick={() => remove(real.id)}>Resetar parcela</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ParcelaEditDialog
        parcela={editParc}
        onClose={() => setEditParc(null)}
        onSave={(patch) => {
          if (!editParc) return;
          const real = transacoes.find(r => r.id === editParc.id);
          if (real) update(real.id, patch);
          else { const { id, data_criacao, ...rest } = editParc; add({ ...rest, ...patch }); }
          setEditParc(null);
        }}
      />
      <EfetivarParcelaDialog
        parcela={efetivar}
        onClose={() => setEfetivar(null)}
        onConfirm={(patch) => {
          if (!efetivar) return;
          const real = transacoes.find(r => r.id === efetivar.id);
          if (real) update(real.id, { ...patch, pago: true });
          else { const { id, data_criacao, ...rest } = efetivar; add({ ...rest, ...patch, pago: true }); }
          setEfetivar(null);
        }}
      />
    </div>
  );
}

function ParcelaEditDialog({ parcela, onClose, onSave }: { parcela: FinTransacao | null; onClose: () => void; onSave: (p: Partial<FinTransacao>) => void }) {
  const { contas } = useFinContas();
  const [valor, setValor] = useState(0);
  const [data, setData] = useState('');
  const [conta, setConta] = useState('');
  useEffect(() => { if (parcela) { setValor(parcela.valor); setData(parcela.data); setConta(parcela.conta_id); } }, [parcela]);
  return (
    <Dialog open={!!parcela} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar parcela {parcela?.parcela}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Valor</Label><Input type="number" step="0.01" value={valor} onChange={e => setValor(Number(e.target.value) || 0)} /></div>
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
          <Button onClick={() => onSave({ valor, data, conta_id: conta })}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EfetivarParcelaDialog({ parcela, onClose, onConfirm }: { parcela: FinTransacao | null; onClose: () => void; onConfirm: (p: { valor: number; data: string; conta_id: string }) => void }) {
  const { contas } = useFinContas();
  const [valor, setValor] = useState(0);
  const [data, setData] = useState('');
  const [conta, setConta] = useState('');
  useEffect(() => { if (parcela) { setValor(parcela.valor); setData(new Date().toISOString().slice(0, 10)); setConta(parcela.conta_id); } }, [parcela]);
  return (
    <Dialog open={!!parcela} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Efetivar parcela {parcela?.parcela}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Valor</Label><Input type="number" step="0.01" value={valor} onChange={e => setValor(Number(e.target.value) || 0)} /></div>
          <div><Label>Data do pagamento</Label><Input type="date" value={data} onChange={e => setData(e.target.value)} /></div>
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
          <Button onClick={() => onConfirm({ valor, data, conta_id: conta })}>Efetivar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
