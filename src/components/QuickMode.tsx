import { useState, useEffect, useCallback } from 'react';
import { Atendimento, TipoAtendimento } from '@/types/atendimento';
import { formatarHora, calcularDuracao } from '@/lib/atendimento-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TIPO_LABELS } from '@/types/atendimento';
import { Play, Square, Clock } from 'lucide-react';

interface QuickModeProps {
  onSave: (atendimento: Atendimento) => void;
}

export function QuickMode({ onSave }: QuickModeProps) {
  const [ativo, setAtivo] = useState(false);
  const [inicio, setInicio] = useState<Date | null>(null);
  const [cliente, setCliente] = useState('');
  const [tipo, setTipo] = useState<TipoAtendimento>('SUPORTE');
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    if (!ativo || !inicio) return;
    const interval = setInterval(() => {
      const diff = Date.now() - inicio.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [ativo, inicio]);

  const iniciar = useCallback(() => {
    setInicio(new Date());
    setAtivo(true);
  }, []);

  const finalizar = useCallback(() => {
    if (!inicio) return;
    const fim = new Date();
    const horaInicio = formatarHora(inicio);
    const horaFim = formatarHora(fim);
    const now = new Date().toISOString();

    const atendimento: Atendimento = {
      id: crypto.randomUUID(),
      cliente: cliente.trim() || 'Cliente não informado',
      descricao: '',
      tipo,
      data: now.split('T')[0],
      hora_inicio: horaInicio,
      hora_fim: horaFim,
      duracao_horas: calcularDuracao(horaInicio, horaFim),
      status: 'REGISTRADO',
      observacoes: '',
      data_criacao: now,
      data_atualizacao: now,
    };

    onSave(atendimento);
    setAtivo(false);
    setInicio(null);
    setCliente('');
    setElapsed('00:00:00');
  }, [inicio, cliente, tipo, onSave]);

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {ativo && <span className="w-2 h-2 rounded-full bg-destructive pulse-recording" />}
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Modo Rápido</span>
        </div>

        <Input
          value={cliente}
          onChange={e => setCliente(e.target.value)}
          placeholder="Cliente"
          className="w-40"
          disabled={ativo}
        />

        <Select value={tipo} onValueChange={v => setTipo(v as TipoAtendimento)} disabled={ativo}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(TIPO_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {ativo && (
          <div className="flex items-center gap-2 font-mono text-lg text-primary font-bold">
            <Clock className="w-4 h-4" />
            {elapsed}
          </div>
        )}

        {!ativo ? (
          <Button onClick={iniciar} size="sm" className="gap-1">
            <Play className="w-3 h-3" /> Iniciar
          </Button>
        ) : (
          <Button onClick={finalizar} variant="destructive" size="sm" className="gap-1">
            <Square className="w-3 h-3" /> Finalizar
          </Button>
        )}
      </div>
    </div>
  );
}
