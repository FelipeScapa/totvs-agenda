import { useState } from 'react';
import { Atendimento, TipoAtendimento, TIPO_LABELS } from '@/types/atendimento';
import { calcularDuracao } from '@/lib/atendimento-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface AtendimentoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (atendimento: Atendimento) => void;
  editando?: Atendimento | null;
}

export function AtendimentoForm({ open, onOpenChange, onSave, editando }: AtendimentoFormProps) {
  const { toast } = useToast();
  const [cliente, setCliente] = useState(editando?.cliente ?? '');
  const [tipo, setTipo] = useState<TipoAtendimento>(editando?.tipo ?? 'SUPORTE');
  const [descricao, setDescricao] = useState(editando?.descricao ?? '');
  const [horaInicio, setHoraInicio] = useState(editando?.hora_inicio ?? '');
  const [horaFim, setHoraFim] = useState(editando?.hora_fim ?? '');
  const [observacoes, setObservacoes] = useState(editando?.observacoes ?? '');

  const handleSave = () => {
    if (!cliente.trim() || !horaInicio || !horaFim) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha cliente, hora início e hora fim.', variant: 'destructive' });
      return;
    }
    const duracao = calcularDuracao(horaInicio, horaFim);
    if (duracao <= 0) {
      toast({ title: 'Duração inválida', description: 'Hora fim deve ser maior que hora início.', variant: 'destructive' });
      return;
    }
    const now = new Date().toISOString();
    const atendimento: Atendimento = {
      id: editando?.id ?? crypto.randomUUID(),
      cliente: cliente.trim(),
      descricao: descricao.trim(),
      tipo,
      data: editando?.data ?? new Date().toISOString().split('T')[0],
      hora_inicio: horaInicio,
      hora_fim: horaFim,
      duracao_horas: duracao,
      status: editando?.status ?? 'REGISTRADO',
      observacoes: observacoes.trim(),
      data_criacao: editando?.data_criacao ?? now,
      data_atualizacao: now,
    };
    onSave(atendimento);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setCliente(''); setTipo('SUPORTE'); setDescricao(''); setHoraInicio(''); setHoraFim(''); setObservacoes('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar' : 'Novo'} Atendimento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Cliente *</Label>
            <Input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Nome do cliente" />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={v => setTipo(v as TipoAtendimento)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Descrição</Label>
            <Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Resumo rápido" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Hora início *</Label>
              <Input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} />
            </div>
            <div>
              <Label>Hora fim *</Label>
              <Input type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Detalhes opcionais" rows={3} />
          </div>
          <Button onClick={handleSave} className="w-full">Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
