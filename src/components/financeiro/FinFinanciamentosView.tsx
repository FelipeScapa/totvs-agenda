import { useState, useMemo } from 'react';
import { useFinFinanciamentos, useFinContas, useFinCategorias, useFinTransacoes } from '@/hooks/use-financeiro';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, ChevronRight, ArrowLeft } from 'lucide-react';
import { fmtBRL, gerarTransacoesFinanciamento, mesAtual } from '@/lib/financeiro-utils';
import { FinFinanciamento } from '@/types/financeiro';

export function FinFinanciamentosView() {
  const { financiamentos, add, remove } = useFinFinanciamentos();
  const { contas } = useFinContas();
  const { categorias } = useFinCategorias();
  const { transacoes, update, add: addTx } = useFinTransacoes();
  const [open, setOpen] = useState(false);
  const [selecionado, setSelecionado] = useState<FinFinanciamento | null>(null);
  const catsDespesa = categorias.filter(c => c.movimento === 'DESPESA');

  const [form, setForm] = useState<Omit<FinFinanciamento, 'id' | 'data_criacao'>>({
    descricao: '', conta_id: '', categoria_id: '', valor_parcela: 0, total_parcelas: 12, parcela_atual: 1, mes_referencia: mesAtual(), dia_vencimento: 5,
  });

  const salvar = () => {
    if (!form.descricao.trim()) return;
    add(form);
    setOpen(false);
    setForm({ descricao: '', conta_id: '', categoria_id: '', valor_parcela: 0, total_parcelas: 12, parcela_atual: 1, mes_referencia: mesAtual(), dia_vencimento: 5 });
  };

  if (selecionado) return <DetalheFinanciamento f={selecionado} onBack={() => setSelecionado(null)} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm uppercase text-muted-foreground tracking-wider">Financiamentos & Parcelamentos ({financiamentos.length})</h2>
        <Button size="sm" className="gap-1" onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Novo</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {financiamentos.length === 0 && <div className="glass-card p-6 text-center text-sm text-muted-foreground md:col-span-2">Nenhum financiamento cadastrado.</div>}
        {financiamentos.map(f => {
          const total = f.valor_parcela * f.total_parcelas;
          const parcPagas = Math.max(0, f.parcela_atual - 1);
          const pago = parcPagas * f.valor_parcela;
          const pct = total > 0 ? (pago / total) * 100 : 0;
          // previsão de término
          const [refY, refM] = f.mes_referencia.split('-').map(Number);
          const fim = new Date(refY, refM - 1 + (f.total_parcelas - f.parcela_atual), 1);
          const fimLabel = fim.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
          return (
            <button key={f.id} onClick={() => setSelecionado(f)} className="glass-card p-4 text-left hover:ring-2 hover:ring-primary transition">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{f.descricao}</h3>
                  <p className="text-xs text-muted-foreground">Parcela {f.parcela_atual}/{f.total_parcelas} • {fmtBRL(f.valor_parcela)}/mês</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{fmtBRL(pago)} pago</span>
                  <span className="text-muted-foreground">{pct.toFixed(0)}% • restante {fmtBRL(total - pago)}</span>
                </div>
                <div className="h-2 bg-muted rounded"><div className="h-full bg-primary rounded" style={{ width: `${pct}%` }} /></div>
                <p className="text-[10px] text-muted-foreground capitalize">previsão de término: {fimLabel}</p>
              </div>
              <div className="flex justify-end mt-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive gap-1 h-7" onClick={e => e.stopPropagation()}><Trash2 className="w-3 h-3" /> Excluir</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={e => e.stopPropagation()}>
                    <AlertDialogHeader><AlertDialogTitle>Excluir financiamento?</AlertDialogTitle><AlertDialogDescription>As parcelas previstas deixarão de aparecer.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => remove(f.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo financiamento</DialogTitle></DialogHeader>
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
            <div className="grid grid-cols-2 gap-3">
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

function DetalheFinanciamento({ f, onBack }: { f: FinFinanciamento; onBack: () => void }) {
  const { transacoes, add, update } = useFinTransacoes();
  const parcelas = useMemo(() => gerarTransacoesFinanciamento(f), [f]);
  const togglePago = (p: typeof parcelas[number]) => {
    const real = transacoes.find(r => r.id === p.id);
    if (real) update(real.id, { pago: !real.pago });
    else add({ ...p, pago: !p.pago } as any);
  };
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1"><ArrowLeft className="w-4 h-4" /> Voltar</Button>
      <h2 className="text-lg font-bold">{f.descricao}</h2>
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground border-b border-border">
            <tr><th className="p-2 text-left">#</th><th className="p-2 text-left">Vencimento</th><th className="p-2 text-right">Valor</th><th className="p-2 text-center">Status</th></tr>
          </thead>
          <tbody>
            {parcelas.map(p => {
              const real = transacoes.find(r => r.id === p.id);
              const pago = real ? real.pago : p.pago;
              return (
                <tr key={p.id} className="border-b border-border/30 hover:bg-accent/40">
                  <td className="p-2">{p.parcela}</td>
                  <td className="p-2 font-mono">{p.data.split('-').reverse().join('/')}</td>
                  <td className="p-2 text-right">{fmtBRL(p.valor)}</td>
                  <td className="p-2 text-center">
                    <button onClick={() => togglePago(p)} className={`text-[10px] px-2 py-0.5 rounded ${pago ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {pago ? 'Pago' : 'Pendente'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
