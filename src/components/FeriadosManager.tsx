import { useState } from 'react';
import { useFeriados, Feriado, TipoFeriado } from '@/hooks/use-feriados';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Plane, PartyPopper, Coffee } from 'lucide-react';
import { formatarData } from '@/lib/atendimento-utils';

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

export function FeriadosManager({ open, onOpenChange }: Props) {
  const { feriados, adicionar, remover } = useFeriados();
  const [tipo, setTipo] = useState<TipoFeriado>('FERIADO');
  const [descricao, setDescricao] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const handleAdd = () => {
    if (!descricao.trim() || !dataInicio) return;
    adicionar({
      tipo,
      descricao: descricao.trim(),
      data_inicio: dataInicio,
      data_fim: dataFim || dataInicio,
    });
    setDescricao(''); setDataInicio(''); setDataFim('');
  };

  const ordenados = [...feriados].sort((a, b) => b.data_inicio.localeCompare(a.data_inicio));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Férias e Feriados</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">
          Atendimentos em datas marcadas não somam horas nem valor nos totalizadores.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
          <div>
            <Label className="text-xs">Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoFeriado)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FERIADO">Feriado</SelectItem>
                <SelectItem value="FERIAS">Férias</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Descrição</Label>
            <Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Natal, Férias julho" className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Início</Label>
            <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Fim (opcional)</Label>
            <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="h-9" />
          </div>
          <Button onClick={handleAdd} className="md:col-span-5 gap-1"><Plus className="w-4 h-4" /> Adicionar</Button>
        </div>

        <div className="space-y-1 mt-2">
          {ordenados.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhum período cadastrado.</p>}
          {ordenados.map(f => (
            <div key={f.id} className="glass-card p-2 flex items-center gap-3">
              <Badge variant="outline" className={f.tipo === 'FERIAS' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-purple-500/20 text-purple-400 border-purple-500/30'}>
                {f.tipo === 'FERIAS' ? <Plane className="w-3 h-3 mr-1" /> : <PartyPopper className="w-3 h-3 mr-1" />}
                {f.tipo === 'FERIAS' ? 'Férias' : 'Feriado'}
              </Badge>
              <span className="font-medium text-sm flex-1 truncate">{f.descricao}</span>
              <span className="text-xs text-muted-foreground">
                {formatarData(f.data_inicio)}{f.data_fim !== f.data_inicio && ` → ${formatarData(f.data_fim)}`}
              </span>
              <Button variant="ghost" size="sm" onClick={() => remover(f.id)} className="hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
