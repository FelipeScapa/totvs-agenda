import { useState, useEffect } from 'react';
import { Atendimento, Modalidade, MODALIDADE_LABELS } from '@/types/atendimento';
import { CurrencyInput } from '@/components/financeiro/CurrencyInput';
import { AnexosEditor } from '@/components/AnexosEditor';
import { calcularDuracao } from '@/lib/atendimento-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTiposAtendimento } from '@/hooks/use-tipos-atendimento';
import { useClientes } from '@/hooks/use-clientes';
import { useServicos } from '@/hooks/use-servicos';

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
  const { servicos } = useServicos();
  const [cliente, setCliente] = useState('');
  const [tipo, setTipo] = useState(tipos[0]?.id ?? 'SUPORTE');
  const [servicoId, setServicoId] = useState(servicos[0]?.id ?? '');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState<Date>(new Date());
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const [temIntervalo, setTemIntervalo] = useState(false);
  const [intervaloInicio, setIntervaloInicio] = useState('12:00');
  const [intervaloFim, setIntervaloFim] = useState('13:30');
  const [observacoes, setObservacoes] = useState('');
  const [modalidade, setModalidade] = useState<Modalidade | ''>('');
  const [temTraslado, setTemTraslado] = useState(false);
  const [trasladoOrigem, setTrasladoOrigem] = useState('');
  const [trasladoDestino, setTrasladoDestino] = useState('');
  const [trasladoSaida, setTrasladoSaida] = useState('');
  const [trasladoRetorno, setTrasladoRetorno] = useState('');
  const [trasladoKm, setTrasladoKm] = useState(0);
  const [trasladoValor, setTrasladoValor] = useState(0);
  const [trasladoObs, setTrasladoObs] = useState('');
  const [valorCafe, setValorCafe] = useState(0);
  const [valorAlmoco, setValorAlmoco] = useState(0);
  const [valorJantar, setValorJantar] = useState(0);
  const [novoId, setNovoId] = useState(() => crypto.randomUUID());

  const atendimentoId = editando?.id ?? novoId;
  const totalAlim = valorCafe + valorAlmoco + valorJantar;

  useEffect(() => {
    if (editando) {
      setModalidade((editando.modalidade as Modalidade) ?? 'REMOTA');
      setTemTraslado(!!editando.tem_traslado);
      setTrasladoOrigem(editando.traslado_origem ?? '');
      setTrasladoDestino(editando.traslado_destino ?? '');
      setTrasladoSaida(editando.traslado_saida ?? '');
      setTrasladoRetorno(editando.traslado_retorno ?? '');
      setTrasladoKm(Number(editando.traslado_km ?? 0));
      setTrasladoValor(Number(editando.traslado_valor ?? 0));
      setTrasladoObs(editando.traslado_obs ?? '');
      setValorCafe(Number(editando.valor_cafe ?? 0));
      setValorAlmoco(Number(editando.valor_almoco ?? 0));
      setValorJantar(Number(editando.valor_jantar ?? 0));
      setCliente(editando.cliente);
      setTipo(editando.tipo);
      setServicoId(editando.servico_id ?? (servicos[0]?.id ?? ''));
      setDescricao(editando.descricao);
      setData(new Date(editando.data + 'T00:00:00'));
      setHoraInicio(editando.hora_inicio);
      setHoraFim(editando.hora_fim);
      setObservacoes(editando.observacoes);
      const hasIntervalo = !!(editando.intervalo_inicio && editando.intervalo_fim);
      setTemIntervalo(hasIntervalo);
      setIntervaloInicio(editando.intervalo_inicio || '12:00');
      setIntervaloFim(editando.intervalo_fim || '13:30');
    }
  }, [editando]);

  const handleSave = () => {
    if (!cliente.trim() || !horaInicio || !horaFim) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha cliente, hora início e hora fim.', variant: 'destructive' });
      return;
    }
    if (!modalidade) {
      toast({ title: 'Tipo de agenda obrigatório', description: 'Selecione se a agenda é Remota ou Presencial.', variant: 'destructive' });
      return;
    }
    let duracao = calcularDuracao(horaInicio, horaFim);
    if (temIntervalo && intervaloInicio && intervaloFim) {
      const duracaoIntervalo = calcularDuracao(intervaloInicio, intervaloFim);
      duracao = Math.max(0, parseFloat((duracao - duracaoIntervalo).toFixed(2)));
    }
    if (duracao <= 0) {
      toast({ title: 'Duração inválida', description: 'Hora fim deve ser maior que hora início.', variant: 'destructive' });
      return;
    }
    const now = new Date().toISOString();
    const dataStr = format(data, 'yyyy-MM-dd');
    const atendimento: Atendimento = {
      id: atendimentoId,
      cliente: cliente.trim(),
      descricao: descricao.trim(),
      tipo,
      servico_id: servicoId || undefined,
      data: dataStr,
      hora_inicio: horaInicio,
      hora_fim: horaFim,
      duracao_horas: duracao,
      status: editando?.status ?? 'REGISTRADO',
      observacoes: observacoes.trim(),
      data_criacao: editando?.data_criacao ?? now,
      data_atualizacao: now,
      intervalo_inicio: temIntervalo ? intervaloInicio : undefined,
      intervalo_fim: temIntervalo ? intervaloFim : undefined,
      modalidade,
      tem_traslado: modalidade === 'PRESENCIAL' ? temTraslado : false,
      traslado_origem: modalidade === 'PRESENCIAL' && temTraslado ? trasladoOrigem.trim() : '',
      traslado_destino: modalidade === 'PRESENCIAL' && temTraslado ? trasladoDestino.trim() : '',
      traslado_saida: modalidade === 'PRESENCIAL' && temTraslado && trasladoSaida ? trasladoSaida : null,
      traslado_retorno: modalidade === 'PRESENCIAL' && temTraslado && trasladoRetorno ? trasladoRetorno : null,
      traslado_km: modalidade === 'PRESENCIAL' && temTraslado ? trasladoKm : 0,
      traslado_valor: modalidade === 'PRESENCIAL' && temTraslado ? trasladoValor : 0,
      traslado_obs: modalidade === 'PRESENCIAL' && temTraslado ? trasladoObs.trim() : '',
      valor_cafe: valorCafe,
      valor_almoco: valorAlmoco,
      valor_jantar: valorJantar,
    };
    onSave(atendimento);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setCliente('');
    setTipo(tipos[0]?.id ?? 'SUPORTE');
    setServicoId(servicos[0]?.id ?? '');
    setDescricao('');
    setData(new Date());
    setHoraInicio('');
    setHoraFim('');
    setTemIntervalo(false);
    setIntervaloInicio('12:00');
    setIntervaloFim('13:30');
    setObservacoes('');
    setModalidade('');
    setTemTraslado(false);
    setTrasladoOrigem('');
    setTrasladoDestino('');
    setTrasladoSaida('');
    setTrasladoRetorno('');
    setTrasladoKm(0);
    setTrasladoValor(0);
    setTrasladoObs('');
    setValorCafe(0);
    setValorAlmoco(0);
    setValorJantar(0);
    setNovoId(crypto.randomUUID());
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
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
            <Label>Tipo de agenda *</Label>
            <Select value={modalidade} onValueChange={(v) => setModalidade(v as Modalidade)}>
              <SelectTrigger><SelectValue placeholder="Remota ou Presencial" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="REMOTA">{MODALIDADE_LABELS.REMOTA}</SelectItem>
                <SelectItem value="PRESENCIAL">{MODALIDADE_LABELS.PRESENCIAL}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
              <Label>Serviço</Label>
              <Select value={servicoId} onValueChange={setServicoId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {servicos.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Data *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !data && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(data, "dd/MM/yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data}
                  onSelect={(d) => d && setData(d)}
                  locale={ptBR}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label>Descrição <span className="text-xs text-muted-foreground">(será usada na OS do TOTVS)</span></Label>
            <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição detalhada da atividade" rows={4} />
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
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox id="tem-intervalo" checked={temIntervalo} onCheckedChange={(v) => setTemIntervalo(!!v)} />
              <Label htmlFor="tem-intervalo" className="cursor-pointer">Teve intervalo</Label>
            </div>
            {temIntervalo && (
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
            )}
          </div>
          {modalidade === 'PRESENCIAL' && (
            <div className="space-y-3 rounded-md border border-border/60 p-3">
              <div className="flex items-center gap-2">
                <Checkbox id="tem-traslado" checked={temTraslado} onCheckedChange={(v) => setTemTraslado(!!v)} />
                <Label htmlFor="tem-traslado" className="cursor-pointer">Possui traslado?</Label>
              </div>
              {temTraslado && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Origem</Label>
                      <Input value={trasladoOrigem} onChange={e => setTrasladoOrigem(e.target.value)} placeholder="Local de saída" />
                    </div>
                    <div>
                      <Label>Destino</Label>
                      <Input value={trasladoDestino} onChange={e => setTrasladoDestino(e.target.value)} placeholder="Local de chegada" />
                    </div>
                    <div>
                      <Label>Hora de saída</Label>
                      <Input type="time" value={trasladoSaida} onChange={e => setTrasladoSaida(e.target.value)} />
                    </div>
                    <div>
                      <Label>Hora de retorno</Label>
                      <Input type="time" value={trasladoRetorno} onChange={e => setTrasladoRetorno(e.target.value)} />
                    </div>
                    <div>
                      <Label>Distância (km)</Label>
                      <Input type="number" min={0} step="0.1" value={trasladoKm} onChange={e => setTrasladoKm(Number(e.target.value) || 0)} />
                    </div>
                    <div>
                      <Label>Custo do traslado</Label>
                      <CurrencyInput value={trasladoValor} onChange={setTrasladoValor} />
                    </div>
                  </div>
                  <div>
                    <Label>Observações do traslado</Label>
                    <Textarea value={trasladoObs} onChange={e => setTrasladoObs(e.target.value)} placeholder="Transporte, pedágio, hospedagem..." rows={2} />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3 rounded-md border border-border/60 p-3">
            <Label className="text-sm font-medium">Alimentação</Label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Café da manhã</Label>
                <CurrencyInput value={valorCafe} onChange={setValorCafe} />
              </div>
              <div>
                <Label className="text-xs">Almoço</Label>
                <CurrencyInput value={valorAlmoco} onChange={setValorAlmoco} />
              </div>
              <div>
                <Label className="text-xs">Jantar</Label>
                <CurrencyInput value={valorJantar} onChange={setValorJantar} />
              </div>
            </div>
            <div className="text-sm text-right">
              Total de alimentação:{' '}
              <span className="font-mono font-semibold">
                {totalAlim.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>

          <div className="rounded-md border border-border/60 p-3">
            <AnexosEditor atendimentoId={atendimentoId} />
          </div>

          <div>
            <Label>Observações <span className="text-xs text-muted-foreground">(uso pessoal)</span></Label>
            <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Anotações pessoais" rows={3} />
          </div>
          <Button onClick={handleSave} className="w-full">Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
