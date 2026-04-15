import { useState, useEffect } from 'react';
import { Atendimento, STATUS_LABELS } from '@/types/atendimento';
import { calcularDuracao } from '@/lib/atendimento-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useTiposAtendimento } from '@/hooks/use-tipos-atendimento';
import { useClientes } from '@/hooks/use-clientes';

interface AtendimentoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (atendimento: Atendimento) => void;
  editando?: Atendimento | null;
}

export function AtendimentoForm({ open, onOpenChange, onSave, editando }: AtendimentoFormProps) {
  const { toast } = useToast();
  const { tipos } = useTiposAtendimento();
  const { clientes } = useClientes();
  const [cliente, setCliente] = useState(editando?.cliente ?? '');
  const [tipo, setTipo] = useState(editando?.tipo ?? (tipos[0]?.id ?? 'SUPORTE'));
  const [descricao, setDescricao] = useState(editando?.descricao ?? '');
  const [data, setData] = useState(editando?.data ?? new Date().toISOString().split('T')[0]);
  const [horaInicio, setHoraInicio] = useState(editando?.hora_inicio ?? '');
  const [horaFim, setHoraFim] = useState(editando?.hora_fim ?? '');
  const [intervaloInicio, setIntervaloInicio] = useState('');
  const [intervaloFim, setIntervaloFim] = useState('');
  const [observacoes, setObservacoes] = useState(editando?.observacoes ?? '');

  useEffect(() => {
    if (editando) {
      setCliente(editando.cliente);
      setTipo(editando.tipo);
      setDescricao(editando.descricao);
      setData(editando.data);
      setHoraInicio(editando.hora_inicio);
      setHoraFim(editando.hora_fim);
      setObservacoes(editando.observacoes);
      setIntervaloInicio('');
      setIntervaloFim('');
    }
  }, [editando]);

  const handleSave = () => {
    if (!cliente.trim() || !horaInicio || !horaFim) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha cliente, hora início e hora fim.', variant: 'destructive' });
      return;
    }
    let duracao = calcularDuracao(horaInicio, horaFim);
    // Descontar intervalo se preenchido
    if (intervaloInicio && intervaloFim) {
      const duracaoIntervalo = calcularDuracao(intervaloInicio, intervaloFim);
      duracao = Math.max(0, parseFloat((duracao - duracaoIntervalo).toFixed(2)));
    }
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
      data,
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
    setCliente('');
    setTipo(tipos[0]?.id ?? 'SUPORTE');
    setDescricao('');
    setData(new Date().toISOString().split('T')[0]);
    setHoraInicio('');
    setHoraFim('');
    setIntervaloInicio('');
    setIntervaloFim('');
    setObservacoes('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar' : 'Novo'} Atendimento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Cliente *</Label>
            {clientes.length > 0 ? (
              <Select value={cliente} onValueChange={setCliente}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  {clientes.map(c => (
                    <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Nome do cliente" />
            )}
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {tipos.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Data *</Label>
            <Input type="date" value={data} onChange={e => setData(e.target.value)} />
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Intervalo início</Label>
              <Input type="time" value={intervaloInicio} onChange={e => setIntervaloInicio(e.target.value)} />
            </div>
            <div>
              <Label>Intervalo fim</Label>
              <Input type="time" value={intervaloFim} onChange={e => setIntervaloFim(e.target.value)} />
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
