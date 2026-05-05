import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import { FinFinanciamentoPessoa } from '@/types/financeiro';
import { fmtBRL } from '@/lib/financeiro-utils';

interface Props {
  valorTotal: number;
  modo: 'percentual' | 'valor';
  onModoChange: (m: 'percentual' | 'valor') => void;
  pessoas: FinFinanciamentoPessoa[];
  onChange: (p: FinFinanciamentoPessoa[]) => void;
}

export function PessoasEditor({ valorTotal, modo, onModoChange, pessoas, onChange }: Props) {
  const add = () => onChange([...pessoas, { nome: '', porcentagem: modo === 'percentual' ? 0 : undefined, valor: modo === 'valor' ? 0 : undefined }]);
  const upd = (i: number, patch: Partial<FinFinanciamentoPessoa>) =>
    onChange(pessoas.map((p, idx) => idx === i ? { ...p, ...patch } : p));
  const rem = (i: number) => onChange(pessoas.filter((_, idx) => idx !== i));

  const totalDeles = pessoas.reduce((s, p) => {
    const v = modo === 'percentual'
      ? valorTotal * ((p.porcentagem ?? 0) / 100)
      : (p.valor ?? 0);
    return s + v;
  }, 0);
  const seu = valorTotal - totalDeles;

  return (
    <div className="space-y-2 border rounded-md p-3 bg-muted/20">
      <div className="flex items-center justify-between">
        <Label className="text-xs uppercase text-muted-foreground tracking-wider">Devedores (dividir)</Label>
        <div className="flex items-center gap-1">
          <Button type="button" size="sm" variant={modo === 'percentual' ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => onModoChange('percentual')}>%</Button>
          <Button type="button" size="sm" variant={modo === 'valor' ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => onModoChange('valor')}>R$</Button>
          <Button type="button" size="sm" variant="ghost" className="h-7 gap-1" onClick={add}><Plus className="w-3 h-3" /> Pessoa</Button>
        </div>
      </div>
      {pessoas.length === 0 && <p className="text-[10px] text-muted-foreground">Adicione pessoas para dividir essa despesa.</p>}
      {pessoas.map((p, i) => {
        const v = modo === 'percentual' ? valorTotal * ((p.porcentagem ?? 0) / 100) : (p.valor ?? 0);
        return (
          <div key={i} className="grid grid-cols-[1fr_100px_auto_auto] gap-2 items-center">
            <Input placeholder="Nome" value={p.nome} onChange={e => upd(i, { nome: e.target.value })} className="h-8" />
            {modo === 'percentual' ? (
              <Input type="number" step="0.01" value={p.porcentagem ?? 0} onChange={e => upd(i, { porcentagem: Number(e.target.value) || 0 })} className="h-8" />
            ) : (
              <Input type="number" step="0.01" value={p.valor ?? 0} onChange={e => upd(i, { valor: Number(e.target.value) || 0 })} className="h-8" />
            )}
            <span className="text-xs text-muted-foreground w-20 text-right">{fmtBRL(v)}</span>
            <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => rem(i)}><X className="w-3 h-3" /></Button>
          </div>
        );
      })}
      {pessoas.length > 0 && (
        <div className="flex justify-between text-[11px] pt-1 border-t border-border/40">
          <span className="text-muted-foreground">Sua parte: <span className="text-foreground font-medium">{fmtBRL(seu)}</span></span>
          <span className="text-muted-foreground">Devem: <span className="text-foreground font-medium">{fmtBRL(totalDeles)}</span></span>
        </div>
      )}
    </div>
  );
}
