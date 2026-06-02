import { useState, useMemo } from 'react';
import { useFinContas, useFinInstituicoes, useFinTransacoes, useFinFinanciamentos } from '@/hooks/use-financeiro';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, Wallet, Banknote, Archive, TrendingUp } from 'lucide-react';
import { fmtBRL, saldoConta, todasComProjecao, ultimoDiaDoMes, mesAtual, mesDeData } from '@/lib/financeiro-utils';
import { FinConta } from '@/types/financeiro';
import { MesSelector } from './MesSelector';
import { CurrencyInput } from './CurrencyInput';

export function FinContasView() {
  const { contas, add, update, remove } = useFinContas();
  const { instituicoes } = useFinInstituicoes();
  const { transacoes, add: addTx } = useFinTransacoes();
  const { financiamentos } = useFinFinanciamentos();
  const [mes, setMes] = useState(mesAtual());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinConta | null>(null);
  const [reajusteOpen, setReajusteOpen] = useState<FinConta | null>(null);

  const [form, setForm] = useState<Omit<FinConta, 'id' | 'data_criacao'>>({
    nome: '', instituicao_id: '', saldo_inicial: 0, vr: false, somar_no_total: true,
  });

  const todas = useMemo(() => todasComProjecao(transacoes, financiamentos, mes), [transacoes, financiamentos, mes]);
  const ate = ultimoDiaDoMes(mes);

  const calc = (c: FinConta) => {
    const atual = saldoConta(c, transacoes);
    const prevMes = todas.filter(t => t.conta_id === c.id && mesDeData(t.data) === mes && !t.pago)
      .reduce((s, t) => s + (t.movimento === 'RECEITA' ? t.valor : -t.valor), 0);
    const previstoFim = saldoConta(c, todas, true, ate);
    return { atual, prevMes, previstoFim };
  };

  const totals = useMemo(() => {
    const sumBy = (filt: (c: FinConta) => boolean) =>
      contas.filter(filt).reduce((acc, c) => {
        const { atual, previstoFim } = calc(c);
        acc.atual += atual; acc.prev += previstoFim;
        return acc;
      }, { atual: 0, prev: 0 });
    return {
      normais: sumBy(c => !c.vr && c.somar_no_total),
      vr: sumBy(c => c.vr),
      fora: sumBy(c => !c.vr && !c.somar_no_total),
    };
  }, [contas, transacoes, todas]);

  const openNew = () => {
    setEditing(null);
    setForm({ nome: '', instituicao_id: instituicoes[0]?.id ?? '', saldo_inicial: 0, vr: false, somar_no_total: true });
    setOpen(true);
  };
  const openEdit = (c: FinConta) => {
    setEditing(c);
    setForm({ nome: c.nome, instituicao_id: c.instituicao_id, saldo_inicial: c.saldo_inicial, vr: c.vr, somar_no_total: c.somar_no_total, arquivada: c.arquivada });
    setOpen(true);
  };

  const salvar = () => {
    if (!form.nome.trim()) return;
    if (editing) update(editing.id, form);
    else add(form);
    setOpen(false);
  };

  const aplicarReajuste = (modo: 'saldo_inicial' | 'movimento', valor: number) => {
    if (!reajusteOpen) return;
    if (modo === 'saldo_inicial') update(reajusteOpen.id, { saldo_inicial: valor });
    else {
      const atual = saldoConta(reajusteOpen, transacoes);
      const delta = valor - atual;
      if (delta === 0) { setReajusteOpen(null); return; }
      addTx({
        data: new Date().toISOString().slice(0, 10),
        descricao: 'Ajuste de saldo',
        movimento: delta > 0 ? 'RECEITA' : 'DESPESA',
        categoria_id: '', conta_id: reajusteOpen.id, valor: Math.abs(delta), pago: true, ajuste: true,
      });
    }
    setReajusteOpen(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <MesSelector mes={mes} onChange={setMes} />
        <Button onClick={openNew} size="sm" className="gap-1"><Plus className="w-4 h-4" /> Nova conta</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: 'Contas (no total)', t: totals.normais, icon: Wallet, color: 'text-primary' },
          { label: 'VR / Refeição', t: totals.vr, icon: Banknote, color: 'text-amber-400' },
          { label: 'Fora do total', t: totals.fora, icon: Archive, color: 'text-muted-foreground' },
        ].map(c => (
          <div key={c.label} className="glass-card p-4 space-y-1">
            <div className="flex items-center gap-2">
              <c.icon className={`w-4 h-4 ${c.color}`} />
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</span>
            </div>
            <p className={`text-2xl font-bold ${c.color}`}>{fmtBRL(c.t.atual)}</p>
            <p className="text-xs text-muted-foreground">Previsto fim do mês: <strong className="text-foreground">{fmtBRL(c.t.prev)}</strong></p>
          </div>
        ))}
      </div>

      <h2 className="text-sm uppercase text-muted-foreground tracking-wider">Contas ({contas.length})</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {contas.length === 0 && (
          <div className="glass-card p-6 text-sm text-muted-foreground text-center md:col-span-2">Nenhuma conta cadastrada.</div>
        )}
        {contas.map(c => {
          const inst = instituicoes.find(i => i.id === c.instituicao_id);
          const { atual, prevMes, previstoFim } = calc(c);
          return (
            <div key={c.id} className="glass-card p-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{c.nome}</span>
                  {c.vr && <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">VR</span>}
                  {!c.somar_no_total && <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">fora</span>}
                </div>
                <p className="text-xs text-muted-foreground">{inst?.nome ?? '—'}</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-card/40 p-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Atual</p>
                    <p className="text-sm font-bold">{fmtBRL(atual)}</p>
                  </div>
                  <div className="rounded-md bg-card/40 p-2">
                    <p className="text-[10px] uppercase text-muted-foreground flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3" />Prev. mês</p>
                    <p className={`text-sm font-bold ${prevMes >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{prevMes >= 0 ? '+' : ''}{fmtBRL(prevMes)}</p>
                  </div>
                  <div className="rounded-md bg-card/40 p-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Final mês</p>
                    <p className="text-sm font-bold text-primary">{fmtBRL(previstoFim)}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(c)} className="gap-1"><Pencil className="w-3 h-3" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setReajusteOpen(c)}>Reajustar</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive gap-1"><Trash2 className="w-3 h-3" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
                      <AlertDialogDescription>Transações vinculadas continuarão existindo, mas ficarão sem conta.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove(c.id)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar conta' : 'Nova conta'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Instituição</Label>
              <Select value={form.instituicao_id || ''} onValueChange={v => setForm({ ...form, instituicao_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{instituicoes.map(i => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Nome da conta</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Nubank principal" /></div>
            <div><Label>Saldo inicial</Label><CurrencyInput value={form.saldo_inicial} onChange={v => setForm({ ...form, saldo_inicial: v })} /></div>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.vr} onCheckedChange={v => setForm({ ...form, vr: !!v })} /> É conta VR / Refeição</label>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.somar_no_total} onCheckedChange={v => setForm({ ...form, somar_no_total: !!v })} /> Somar no card "Valor Atual"</label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReajusteDialog conta={reajusteOpen} onClose={() => setReajusteOpen(null)} onApply={aplicarReajuste} saldoAtual={reajusteOpen ? saldoConta(reajusteOpen, transacoes) : 0} />
    </div>
  );
}

function ReajusteDialog({ conta, onClose, onApply, saldoAtual }: { conta: FinConta | null; onClose: () => void; onApply: (modo: 'saldo_inicial' | 'movimento', valor: number) => void; saldoAtual: number }) {
  const [modo, setModo] = useState<'saldo_inicial' | 'movimento'>('movimento');
  const [valor, setValor] = useState(0);
  return (
    <Dialog open={!!conta} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Reajustar saldo</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Saldo atual calculado: <strong>{fmtBRL(saldoAtual)}</strong></p>
        <div className="space-y-3">
          <Select value={modo} onValueChange={v => setModo(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="movimento">Criar lançamento de ajuste (mantém histórico)</SelectItem>
              <SelectItem value="saldo_inicial">Alterar saldo inicial (sem movimento)</SelectItem>
            </SelectContent>
          </Select>
          <div>
            <Label>{modo === 'saldo_inicial' ? 'Novo saldo inicial' : 'Saldo desejado agora'}</Label>
            <CurrencyInput value={valor} onChange={setValor} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onApply(modo, valor)}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
