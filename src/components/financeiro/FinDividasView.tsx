import { useState, useMemo } from 'react';
import { useFinDividas } from '@/hooks/use-financeiro';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Banknote, Calendar, Layers } from 'lucide-react';
import { fmtBRL } from '@/lib/financeiro-utils';
import { CurrencyInput } from './CurrencyInput';
import { FinDivida, FinDividaTipo } from '@/types/financeiro';

const emptyForm = (): Omit<FinDivida, 'id' | 'data_criacao'> => ({
  descricao: '', credor: '', tipo: 'AVISTA', valor_total: 0, valor_pago: 0,
  valor_avista: 0, valor_parcela: 0, total_parcelas: 1, observacao: '',
});

export function FinDividasView() {
  const { dividas, add, update, remove } = useFinDividas();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinDivida | null>(null);
  const [form, setForm] = useState(emptyForm());

  const stats = useMemo(() => {
    const aberto = dividas.reduce((s, d) => s + (d.valor_total - d.valor_pago), 0);
    const avista = dividas.filter(d => d.tipo === 'AVISTA').reduce((s, d) => s + (d.valor_avista ?? d.valor_total) - d.valor_pago, 0);
    const parcelada = dividas.filter(d => d.tipo === 'PARCELADA').reduce((s, d) => s + ((d.valor_parcela ?? 0) * (d.total_parcelas ?? 0)) - d.valor_pago, 0);
    const totalParcelas = dividas.filter(d => d.tipo === 'PARCELADA').reduce((s, d) => s + (d.total_parcelas ?? 0), 0);
    return { aberto, avista, parcelada, totalParcelas };
  }, [dividas]);

  const openNew = () => { setEditing(null); setForm(emptyForm()); setOpen(true); };
  const openEdit = (d: FinDivida) => {
    setEditing(d);
    setForm({ descricao: d.descricao, credor: d.credor, tipo: d.tipo, valor_total: d.valor_total, valor_pago: d.valor_pago, valor_avista: d.valor_avista ?? 0, valor_parcela: d.valor_parcela ?? 0, total_parcelas: d.total_parcelas ?? 1, observacao: d.observacao ?? '' });
    setOpen(true);
  };
  const salvar = () => {
    if (!form.descricao.trim()) return;
    const total = form.tipo === 'PARCELADA' ? (form.valor_parcela ?? 0) * (form.total_parcelas ?? 1) : form.valor_total;
    const payload = { ...form, valor_total: total };
    if (editing) update(editing.id, payload);
    else add(payload);
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <CardStat icon={Layers} label="Total em aberto" value={fmtBRL(stats.aberto)} color="text-primary" />
        <CardStat icon={Banknote} label="À vista" value={fmtBRL(stats.avista)} sub={`condição de quitação`} color="text-emerald-400" />
        <CardStat icon={Calendar} label="Parceladas" value={fmtBRL(stats.parcelada)} sub={`${stats.totalParcelas} parcela(s)`} color="text-amber-400" />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm uppercase text-muted-foreground tracking-wider">Dívidas ({dividas.length})</h2>
        <Button size="sm" className="gap-1" onClick={openNew}><Plus className="w-4 h-4" /> Nova</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {dividas.length === 0 && <div className="glass-card p-6 text-center text-sm text-muted-foreground md:col-span-2">Nenhuma dívida cadastrada.</div>}
        {dividas.map(d => {
          const total = d.tipo === 'PARCELADA' ? (d.valor_parcela ?? 0) * (d.total_parcelas ?? 0) : d.valor_total;
          const pct = total > 0 ? (d.valor_pago / total) * 100 : 0;
          const economia = d.tipo === 'AVISTA' && d.valor_avista ? total - d.valor_avista : 0;
          return (
            <div key={d.id} className="glass-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium truncate">{d.descricao}</h3>
                    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${d.tipo === 'AVISTA' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{d.tipo === 'AVISTA' ? 'À vista' : 'Parcelada'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Credor: {d.credor}</p>
                </div>
                <div className="flex">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(d)}>✏️</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="w-3 h-3" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Excluir dívida?</AlertDialogTitle><AlertDialogDescription>Não pode ser desfeito.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => remove(d.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="text-xs space-y-0.5">
                <div className="flex justify-between"><span className="text-muted-foreground">Total bruto</span><span className="font-medium">{fmtBRL(total)}</span></div>
                {d.tipo === 'AVISTA' && d.valor_avista != null && (
                  <div className="flex justify-between"><span className="text-emerald-400">À vista</span><span className="font-medium text-emerald-400">{fmtBRL(d.valor_avista)}</span></div>
                )}
                {economia > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Economia à vista</span><span className="text-emerald-400">−{fmtBRL(economia)}</span></div>}
                {d.tipo === 'PARCELADA' && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Parcelas</span><span className="font-medium">{d.total_parcelas}× {fmtBRL(d.valor_parcela ?? 0)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">Pago</span><span className="font-medium">{fmtBRL(d.valor_pago)}</span></div>
              </div>
              <div className="h-2 bg-muted rounded"><div className="h-full bg-primary rounded" style={{ width: `${pct}%` }} /></div>
              <CurrencyInput value={d.valor_pago} onChange={v => update(d.id, { valor_pago: v })} className="h-8 text-xs" />
              {d.observacao && <p className="text-xs text-muted-foreground">{d.observacao}</p>}
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar dívida' : 'Nova dívida'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Descrição</Label><Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
            <div><Label>Credor</Label><Input value={form.credor} onChange={e => setForm({ ...form, credor: e.target.value })} /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as FinDividaTipo })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVISTA">À vista</SelectItem>
                  <SelectItem value="PARCELADA">Parcelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.tipo === 'AVISTA' ? (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Valor total</Label><CurrencyInput value={form.valor_total} onChange={v => setForm({ ...form, valor_total: v })} /></div>
                <div><Label>Valor à vista</Label><CurrencyInput value={form.valor_avista ?? 0} onChange={v => setForm({ ...form, valor_avista: v })} /></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Valor da parcela</Label><CurrencyInput value={form.valor_parcela ?? 0} onChange={v => setForm({ ...form, valor_parcela: v })} /></div>
                <div><Label>Total de parcelas</Label><Input type="number" min={1} value={form.total_parcelas ?? 1} onChange={e => setForm({ ...form, total_parcelas: Number(e.target.value) || 1 })} /></div>
              </div>
            )}
            <div><Label>Já pago</Label><CurrencyInput value={form.valor_pago} onChange={v => setForm({ ...form, valor_pago: v })} /></div>
            <div><Label>Observação</Label><Input value={form.observacao ?? ''} onChange={e => setForm({ ...form, observacao: e.target.value })} /></div>
            {form.tipo === 'PARCELADA' && (
              <p className="text-xs text-muted-foreground">Total: <strong>{fmtBRL((form.valor_parcela ?? 0) * (form.total_parcelas ?? 0))}</strong></p>
            )}
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

function CardStat({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="glass-card p-4 space-y-1">
      <div className="flex items-center gap-2"><Icon className={`w-4 h-4 ${color}`} /><span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span></div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
