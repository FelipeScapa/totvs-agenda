import { useState, useMemo } from 'react';
import { useFinCategorias, useFinTipos, useFinInstituicoes, useFinDivisao, useFinLimites, useFinTransacoes } from '@/hooks/use-financeiro';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus } from 'lucide-react';
import { MesSelector } from './MesSelector';
import { mesAtual, fmtBRL, mesDeData, todasComProjecao } from '@/lib/financeiro-utils';
import { useFinFinanciamentos } from '@/hooks/use-financeiro';

export function FinConfiguracoes() {
  const { categorias, add: addCat, update: updCat, remove: rmCat } = useFinCategorias();
  const { tipos, add: addTipo, update: updTipo, remove: rmTipo } = useFinTipos();
  const { instituicoes, add: addInst, remove: rmInst } = useFinInstituicoes();
  const { divisao, set: setDiv } = useFinDivisao();
  const { limites, set: setLimite, remove: rmLimite } = useFinLimites();
  const { transacoes } = useFinTransacoes();
  const { financiamentos } = useFinFinanciamentos();

  const [novaCat, setNovaCat] = useState({ nome: '', movimento: 'DESPESA' as 'DESPESA' | 'RECEITA', tipo_id: '', somar_nos_ganhos: true });
  const [novoTipo, setNovoTipo] = useState('');
  const [novaInst, setNovaInst] = useState('');
  const [mesLimite, setMesLimite] = useState(mesAtual());

  const tiposEmUso = new Set(transacoes.map(t => t.tipo_id).filter(Boolean));
  const modoDiv = divisao.modo ?? 'percentual';
  const fonteDiv = divisao.fonte ?? 'recebido';

  // Receita do mês para divisão dos ganhos — previsto ou apenas recebido
  const receitaMesDivisao = useMemo(() => {
    return todasComProjecao(transacoes, financiamentos, mesLimite)
      .filter(t => mesDeData(t.data) === mesLimite && t.movimento === 'RECEITA' && (fonteDiv === 'previsto' || t.pago))
      .filter(t => {
        const cat = categorias.find(c => c.id === t.categoria_id);
        return cat?.somar_nos_ganhos !== false;
      })
      .reduce((s, t) => s + t.valor, 0);
  }, [transacoes, financiamentos, mesLimite, categorias, fonteDiv]);

  const totalDivisao = Object.values(divisao.porcentagens).reduce((s, n) => s + (Number(n) || 0), 0);
  const totalLimitesMes = limites.filter(l => l.mes === mesLimite).reduce((s, l) => s + l.valor, 0);

  return (
    <Tabs defaultValue="categorias">
      <TabsList className="flex-wrap h-auto">
        <TabsTrigger value="categorias">Categorias</TabsTrigger>
        <TabsTrigger value="tipos">Tipos</TabsTrigger>
        <TabsTrigger value="instituicoes">Instituições</TabsTrigger>
        <TabsTrigger value="divisao">Divisão de ganhos</TabsTrigger>
        <TabsTrigger value="limites">Limites</TabsTrigger>
      </TabsList>

      <TabsContent value="categorias" className="space-y-3">
        <div className="glass-card p-3 grid grid-cols-1 md:grid-cols-5 gap-2">
          <Input placeholder="Nome" value={novaCat.nome} onChange={e => setNovaCat({ ...novaCat, nome: e.target.value })} />
          <Select value={novaCat.movimento} onValueChange={(v) => setNovaCat({ ...novaCat, movimento: v as any, tipo_id: '' })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DESPESA">Despesa</SelectItem>
              <SelectItem value="RECEITA">Receita</SelectItem>
            </SelectContent>
          </Select>
          {novaCat.movimento === 'DESPESA' ? (
            <Select value={novaCat.tipo_id || '__none__'} onValueChange={(v) => setNovaCat({ ...novaCat, tipo_id: v === '__none__' ? '' : v })}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Sem tipo —</SelectItem>
                {tipos.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={novaCat.somar_nos_ganhos} onCheckedChange={(v) => setNovaCat({ ...novaCat, somar_nos_ganhos: !!v })} />
              Somar nos ganhos
            </label>
          )}
          <div />
          <Button onClick={() => {
            if (!novaCat.nome.trim()) return;
            addCat({
              nome: novaCat.nome.trim(),
              movimento: novaCat.movimento,
              tipo_id: novaCat.movimento === 'DESPESA' ? (novaCat.tipo_id || undefined) : undefined,
              somar_nos_ganhos: novaCat.movimento === 'RECEITA' ? novaCat.somar_nos_ganhos : undefined,
            });
            setNovaCat({ ...novaCat, nome: '', tipo_id: '' });
          }} className="gap-1"><Plus className="w-4 h-4" /> Adicionar</Button>
        </div>

        {(['DESPESA', 'RECEITA'] as const).map(mov => (
          <div key={mov} className="glass-card p-3">
            <h3 className="text-xs uppercase text-muted-foreground mb-2">{mov === 'DESPESA' ? 'Despesas' : 'Receitas'}</h3>
            <div className="space-y-1">
              {categorias.filter(c => c.movimento === mov).map(c => (
                <div key={c.id} className="flex items-center justify-between p-2 hover:bg-accent rounded gap-2">
                  <span className="text-sm flex-1">{c.nome}</span>
                  {mov === 'DESPESA' ? (
                    <Select value={c.tipo_id || '__none__'} onValueChange={v => updCat(c.id, { tipo_id: v === '__none__' ? undefined : v })}>
                      <SelectTrigger className="h-7 w-40 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Sem tipo —</SelectItem>
                        {tipos.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <label className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Checkbox checked={c.somar_nos_ganhos !== false} onCheckedChange={v => updCat(c.id, { somar_nos_ganhos: !!v })} />
                      ganhos
                    </label>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => rmCat(c.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </TabsContent>

      <TabsContent value="tipos" className="space-y-3">
        <p className="text-xs text-muted-foreground">Tipos para classificar despesas e dividir ganhos (Essencial, Qualidade, Investimento…). Tipos em uso só podem ser renomeados.</p>
        <div className="glass-card p-3 flex gap-2">
          <Input placeholder="Novo tipo" value={novoTipo} onChange={e => setNovoTipo(e.target.value)} />
          <Button onClick={() => { if (novoTipo.trim()) { addTipo(novoTipo.trim()); setNovoTipo(''); } }} className="gap-1"><Plus className="w-4 h-4" /> Adicionar</Button>
        </div>
        <div className="glass-card p-3 space-y-1">
          {tipos.map(t => {
            const emUso = tiposEmUso.has(t.id);
            return (
              <div key={t.id} className="flex items-center gap-2 p-2 hover:bg-accent rounded">
                <Input value={t.nome} onChange={e => updTipo(t.id, { nome: e.target.value })} className="h-8" />
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={emUso} title={emUso ? 'Em uso' : ''} onClick={() => rmTipo(t.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="instituicoes" className="space-y-3">
        <div className="glass-card p-3 flex gap-2">
          <Input placeholder="Nova instituição" value={novaInst} onChange={e => setNovaInst(e.target.value)} />
          <Button onClick={() => { if (novaInst.trim()) { addInst(novaInst.trim()); setNovaInst(''); } }} className="gap-1"><Plus className="w-4 h-4" /> Adicionar</Button>
        </div>
        <div className="glass-card p-3 grid grid-cols-2 md:grid-cols-3 gap-2">
          {instituicoes.map(i => (
            <div key={i.id} className="flex items-center justify-between p-2 hover:bg-accent rounded">
              <span className="text-sm">{i.nome}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => rmInst(i.id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="divisao" className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Label>Mês:</Label>
          <MesSelector mes={mesLimite} onChange={setMesLimite} />
          <Select value={modoDiv} onValueChange={v => setDiv({ ...divisao, modo: v as any })}>
            <SelectTrigger className="w-44 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percentual">Por porcentagem</SelectItem>
              <SelectItem value="valor">Por valor fixo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={fonteDiv} onValueChange={v => setDiv({ ...divisao, fonte: v as any })}>
            <SelectTrigger className="w-48 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recebido">Receita já recebida</SelectItem>
              <SelectItem value="previsto">Receita prevista do mês</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">Base: <strong className="text-emerald-400">{fmtBRL(receitaMesDivisao)}</strong></span>
        </div>
        {modoDiv === 'percentual' && (
          <p className="text-xs text-muted-foreground">Total: <span className={totalDivisao === 100 ? 'text-primary' : 'text-warning'}>{totalDivisao}%</span></p>
        )}
        <div className="glass-card p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          {tipos.map(t => {
            const v = divisao.porcentagens[t.id] ?? 0;
            const calculado = modoDiv === 'percentual' ? receitaMesDivisao * (v / 100) : v;
            return (
              <div key={t.id} className="flex items-center gap-2">
                <Label className="flex-1">{t.nome}</Label>
                <Input
                  type="number" min={0} step={modoDiv === 'percentual' ? 1 : 0.01} className="w-28"
                  value={v}
                  onChange={e => setDiv({ ...divisao, porcentagens: { ...divisao.porcentagens, [t.id]: Number(e.target.value) } })}
                />
                <span className="text-muted-foreground text-sm w-8">{modoDiv === 'percentual' ? '%' : 'R$'}</span>
                <span className="text-xs text-muted-foreground w-28 text-right">= {fmtBRL(calculado)}</span>
              </div>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="limites" className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Label>Mês:</Label>
          <MesSelector mes={mesLimite} onChange={setMesLimite} />
          <span className="text-xs text-muted-foreground ml-auto">Total dos limites do mês: <strong>{fmtBRL(totalLimitesMes)}</strong></span>
        </div>
        <div className="glass-card p-3 space-y-2">
          {categorias.filter(c => c.movimento === 'DESPESA').map(c => {
            const lim = limites.find(l => l.categoria_id === c.id && l.mes === mesLimite);
            return (
              <div key={c.id} className="flex items-center gap-2">
                <Label className="flex-1">{c.nome}</Label>
                <Input
                  type="number" min={0} step="0.01" className="w-32"
                  defaultValue={lim?.valor ?? ''}
                  placeholder="0,00"
                  onBlur={e => setLimite(c.id, mesLimite, Number(e.target.value) || 0)}
                />
                <span className="text-muted-foreground text-sm w-24 text-right">{lim ? fmtBRL(lim.valor) : '—'}</span>
                {lim && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => rmLimite(lim.id)}><Trash2 className="w-3 h-3" /></Button>}
              </div>
            );
          })}
        </div>
      </TabsContent>
    </Tabs>
  );
}
