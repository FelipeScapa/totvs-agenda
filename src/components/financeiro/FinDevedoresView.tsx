import { useMemo, useState } from 'react';
import { useFinTransacoes, useFinFinanciamentos } from '@/hooks/use-financeiro';
import { agregarDevedores, fmtBRL, transacoesComFinanciamentos, mesAtual, mesDeData } from '@/lib/financeiro-utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronRight, CheckCircle2, RotateCcw, Users } from 'lucide-react';
import { MesSelector } from './MesSelector';

export function FinDevedoresView() {
  const { transacoes, update, add } = useFinTransacoes();
  const { financiamentos } = useFinFinanciamentos();
  const [mes, setMes] = useState(mesAtual());
  const [incluirFuturos, setIncluirFuturos] = useState(false);

  const todas = useMemo(() => transacoesComFinanciamentos(transacoes, financiamentos), [transacoes, financiamentos]);

  // Filtra: do mês atual + passadas não quitadas, exclui futuras (a menos que toggle)
  const filtradas = useMemo(() => {
    return todas.filter(t => {
      const m = mesDeData(t.data);
      if (incluirFuturos) return true;
      return m <= mes;
    });
  }, [todas, mes, incluirFuturos]);

  const grupos = useMemo(() => agregarDevedores(filtradas), [filtradas]);
  const [aberto, setAberto] = useState<string | null>(null);
  const totalGeral = grupos.reduce((s, g) => s + g.total, 0);

  const quitar = (transId: string, nome: string, ja: string[] | undefined) => {
    const real = transacoes.find(t => t.id === transId);
    const novos = [...(ja ?? []), nome];
    if (real) update(real.id, { pessoas_quitadas: novos });
    else {
      const virt = todas.find(t => t.id === transId);
      if (!virt) return;
      const { id, data_criacao, ...rest } = virt;
      add({ ...rest, pessoas_quitadas: novos });
    }
  };

  const desfazer = (transId: string, nome: string) => {
    const real = transacoes.find(t => t.id === transId);
    if (!real) return;
    update(real.id, { pessoas_quitadas: (real.pessoas_quitadas ?? []).filter(n => n !== nome) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-sm uppercase text-muted-foreground tracking-wider flex items-center gap-2"><Users className="w-4 h-4" /> Devedores</h2>
          <p className="text-2xl font-bold mt-1">{fmtBRL(totalGeral)} <span className="text-xs text-muted-foreground font-normal">a receber até {mes}</span></p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <MesSelector mes={mes} onChange={setMes} />
          <div className="flex items-center gap-2">
            <Switch id="fut" checked={incluirFuturos} onCheckedChange={setIncluirFuturos} />
            <Label htmlFor="fut" className="text-xs cursor-pointer">Incluir futuros</Label>
          </div>
        </div>
      </div>

      {grupos.length === 0 && (
        <div className="glass-card p-6 text-center text-sm text-muted-foreground">
          Nenhum devedor pendente até este mês.
        </div>
      )}

      <div className="space-y-2">
        {grupos.map(g => {
          const isOpen = aberto === g.nome;
          return (
            <div key={g.nome} className="glass-card overflow-hidden">
              <button onClick={() => setAberto(isOpen ? null : g.nome)} className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition">
                <div className="flex items-center gap-2">
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <div className="text-left">
                    <p className="font-medium">{g.nome}</p>
                    <p className="text-xs text-muted-foreground">{g.itens.length} {g.itens.length === 1 ? 'item' : 'itens'}</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-amber-400">{fmtBRL(g.total)}</span>
              </button>
              {isOpen && (
                <div className="border-t border-border/40">
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase text-muted-foreground">
                      <tr><th className="p-2 text-left">Data</th><th className="p-2 text-left">Descrição</th><th className="p-2 text-right">Devido</th><th className="p-2 text-center w-24">Ação</th></tr>
                    </thead>
                    <tbody>
                      {g.itens.map(({ transacao: t, valor }) => (
                        <tr key={t.id} className="border-t border-border/30">
                          <td className="p-2 font-mono text-xs">{t.data.split('-').reverse().join('/')}</td>
                          <td className="p-2">{t.descricao}</td>
                          <td className="p-2 text-right font-medium">{fmtBRL(valor)}</td>
                          <td className="p-2 text-center">
                            <Button size="sm" variant="ghost" className="h-7 gap-1 text-emerald-400" onClick={() => quitar(t.id, g.nome, t.pessoas_quitadas)}>
                              <CheckCircle2 className="w-3 h-3" /> Quitar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <QuitadosRecentes transacoes={filtradas} desfazer={desfazer} />
    </div>
  );
}

function QuitadosRecentes({ transacoes, desfazer }: { transacoes: any[]; desfazer: (id: string, nome: string) => void }) {
  const itens: { trans: any; nome: string; valor: number }[] = [];
  for (const t of transacoes) {
    if (!t.pessoas_quitadas?.length) continue;
    for (const nome of t.pessoas_quitadas) {
      const p = t.pessoas?.find((x: any) => x.nome === nome);
      if (!p) continue;
      const v = p.porcentagem != null ? t.valor * (p.porcentagem / 100) : (p.valor ?? 0);
      itens.push({ trans: t, nome, valor: v });
    }
  }
  if (itens.length === 0) return null;
  return (
    <div className="glass-card p-4 space-y-2">
      <h3 className="text-sm uppercase tracking-wider text-muted-foreground">Quitados</h3>
      <div className="space-y-1">
        {itens.slice(0, 10).map((it, i) => (
          <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
            <span><span className="font-medium">{it.nome}</span> · {it.trans.descricao}</span>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-medium">{fmtBRL(it.valor)}</span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => desfazer(it.trans.id, it.nome)} title="Desfazer">
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
