import { useState } from 'react';
import { useFinDividas } from '@/hooks/use-financeiro';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2 } from 'lucide-react';
import { fmtBRL } from '@/lib/financeiro-utils';

export function FinDividasView() {
  const { dividas, add, update, remove } = useFinDividas();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ descricao: '', credor: '', valor_total: 0, valor_pago: 0, observacao: '' });

  const total = dividas.reduce((s, d) => s + (d.valor_total - d.valor_pago), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm uppercase text-muted-foreground tracking-wider">Dívidas</h2>
          <p className="text-2xl font-bold mt-1">{fmtBRL(total)} <span className="text-xs text-muted-foreground font-normal">em aberto</span></p>
        </div>
        <Button size="sm" className="gap-1" onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Nova</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {dividas.length === 0 && <div className="glass-card p-6 text-center text-sm text-muted-foreground md:col-span-2">Nenhuma dívida cadastrada.</div>}
        {dividas.map(d => {
          const pct = d.valor_total > 0 ? (d.valor_pago / d.valor_total) * 100 : 0;
          return (
            <div key={d.id} className="glass-card p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{d.descricao}</h3>
                  <p className="text-xs text-muted-foreground">Credor: {d.credor}</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="w-3 h-3" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Excluir dívida?</AlertDialogTitle><AlertDialogDescription>Não pode ser desfeito.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => remove(d.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className="flex justify-between text-sm"><span>{fmtBRL(d.valor_pago)} pago</span><span className="text-muted-foreground">de {fmtBRL(d.valor_total)}</span></div>
              <div className="h-2 bg-muted rounded"><div className="h-full bg-primary rounded" style={{ width: `${pct}%` }} /></div>
              <Input type="number" step="0.01" value={d.valor_pago} onChange={e => update(d.id, { valor_pago: Number(e.target.value) || 0 })} className="h-8 text-xs" placeholder="Atualizar valor pago" />
              {d.observacao && <p className="text-xs text-muted-foreground">{d.observacao}</p>}
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova dívida</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Descrição</Label><Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
            <div><Label>Credor</Label><Input value={form.credor} onChange={e => setForm({ ...form, credor: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor total</Label><Input type="number" step="0.01" value={form.valor_total} onChange={e => setForm({ ...form, valor_total: Number(e.target.value) || 0 })} /></div>
              <div><Label>Já pago</Label><Input type="number" step="0.01" value={form.valor_pago} onChange={e => setForm({ ...form, valor_pago: Number(e.target.value) || 0 })} /></div>
            </div>
            <div><Label>Observação</Label><Input value={form.observacao} onChange={e => setForm({ ...form, observacao: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => { if (form.descricao.trim()) { add(form); setOpen(false); setForm({ descricao: '', credor: '', valor_total: 0, valor_pago: 0, observacao: '' }); } }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
