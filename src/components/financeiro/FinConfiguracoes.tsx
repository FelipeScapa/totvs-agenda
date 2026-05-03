import { useState } from 'react';
import { useFinCategorias, useFinTipos, useFinInstituicoes, useFinDivisao, useFinLimites, useFinContas } from '@/hooks/use-financeiro';
import { useFinTransacoes } from '@/hooks/use-financeiro';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus } from 'lucide-react';
import { MesSelector } from './MesSelector';
import { mesAtual, fmtBRL } from '@/lib/financeiro-utils';

export function FinConfiguracoes() {
  const { categorias, add: addCat, update: updCat, remove: rmCat } = useFinCategorias();
  const { tipos, add: addTipo, update: updTipo, remove: rmTipo } = useFinTipos();
  const { instituicoes, add: addInst, remove: rmInst } = useFinInstituicoes();
  const { divisao, set: setDiv } = useFinDivisao();
  const { limites, set: setLimite, remove: rmLimite } = useFinLimites();
  const { categorias: cats } = useFinCategorias();
  const { transacoes } = useFinTransacoes();

  const [novaCat, setNovaCat] = useState({ nome: '', movimento: 'DESPESA' as 'DESPESA' | 'RECEITA', parent_id: '', somar_nos_ganhos: true });
  const [novoTipo, setNovoTipo] = useState('');
  const [novaInst, setNovaInst] = useState('');
  const [mesLimite, setMesLimite] = useState(mesAtual());

  const tiposEmUso = new Set(transacoes.map(t => t.tipo_id).filter(Boolean));

  const totalDivisao = Object.values(divisao.porcentagens).reduce((s, n) => s + (Number(n) || 0), 0);

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
          <Select value={novaCat.movimento} onValueChange={(v) => setNovaCat({ ...novaCat, movimento: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DESPESA">Despesa</SelectItem>
              <SelectItem value="RECEITA">Receita</SelectItem>
            </SelectContent>
          </Select>
          <Select value={novaCat.parent_id || '__none__'} onValueChange={(v) => setNovaCat({ ...novaCat, parent_id: v === '__none__' ? '' : v })}>
            <SelectTrigger><SelectValue placeholder="Categoria pai (opcional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Sem pai —</SelectItem>
              {cats.filter(c => c.movimento === novaCat.movimento && !c.parent_id).map(c => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {novaCat.movimento === 'RECEITA' ? (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={novaCat.somar_nos_ganhos} onCheckedChange={(v) => setNovaCat({ ...novaCat, somar_nos_ganhos: !!v })} />
              Somar nos ganhos
            </label>
          ) : <div />}
          <Button onClick={() => { if (novaCat.nome.trim()) { addCat({ nome: novaCat.nome.trim(), movimento: novaCat.movimento, parent_id: novaCat.parent_id || undefined, somar_nos_ganhos: novaCat.movimento === 'RECEITA' ? novaCat.somar_nos_ganhos : undefined }); setNovaCat({ ...novaCat, nome: '' }); } }} className="gap-1"><Plus className="w-4 h-4" /> Adicionar</Button>
        </div>

        {(['DESPESA', 'RECEITA'] as const).map(mov => (
          <div key={mov} className="glass-card p-3">
            <h3 className="text-xs uppercase text-muted-foreground mb-2">{mov === 'DESPESA' ? 'Despesas' : 'Receitas'}</h3>
            <div className="space-y-1">
              {categorias.filter(c => c.movimento === mov && !c.parent_id).map(c => {
                const filhos = categorias.filter(s => s.parent_id === c.id);
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between p-2 hover:bg-accent rounded">
                      <span className="text-sm">{c.nome}{c.movimento === 'RECEITA' && c.somar_nos_ganhos && <span className="ml-2 text-xs text-primary">↑ ganhos</span>}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => rmCat(c.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                    {filhos.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-2 pl-8 hover:bg-accent rounded text-sm text-muted-foreground">
                        <span>↳ {s.nome}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => rmCat(s.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    ))}
                  </div>
                );
              })}
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
        <p className="text-xs text-muted-foreground">Defina o percentual de cada tipo na divisão dos ganhos. Total atual: <span className={totalDivisao === 100 ? 'text-primary' : 'text-warning'}>{totalDivisao}%</span></p>
        <div className="glass-card p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          {tipos.map(t => (
            <div key={t.id} className="flex items-center gap-2">
              <Label className="flex-1">{t.nome}</Label>
              <Input
                type="number" min={0} max={100} className="w-24"
                value={divisao.porcentagens[t.id] ?? 0}
                onChange={e => setDiv({ porcentagens: { ...divisao.porcentagens, [t.id]: Number(e.target.value) } })}
              />
              <span className="text-muted-foreground text-sm">%</span>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="limites" className="space-y-3">
        <div className="flex items-center gap-3">
          <Label>Mês:</Label>
          <MesSelector mes={mesLimite} onChange={setMesLimite} />
        </div>
        <div className="glass-card p-3 space-y-2">
          {categorias.filter(c => c.movimento === 'DESPESA' && !c.parent_id).map(c => {
            const lim = limites.find(l => l.categoria_id === c.id && l.mes === mesLimite);
            return (
              <div key={c.id} className="flex items-center gap-2">
                <Label className="flex-1">{c.nome}</Label>
                <Input
                  type="number" min={0} step="0.01" className="w-32"
                  value={lim?.valor ?? ''}
                  placeholder="0,00"
                  onChange={e => setLimite(c.id, mesLimite, Number(e.target.value) || 0)}
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
