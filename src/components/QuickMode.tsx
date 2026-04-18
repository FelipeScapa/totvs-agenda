import { useState, useEffect, useCallback } from 'react';
import { Atendimento } from '@/types/atendimento';
import { formatarHora } from '@/lib/atendimento-utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTiposAtendimento } from '@/hooks/use-tipos-atendimento';
import { useClientes } from '@/hooks/use-clientes';
import { useServicos } from '@/hooks/use-servicos';
import { Play, Square, Clock, Pause, PlayCircle } from 'lucide-react';

interface QuickModeProps {
  onSave: (atendimento: Atendimento) => void;
}

const STORAGE_KEY = 'agenda-log-quickmode';

interface PersistedState {
  ativo: boolean;
  pausado: boolean;
  inicioISO: string | null;
  cliente: string;
  tipo: string;
  servicoId: string;
  totalPausado: number;
  pausaInicioISO: string | null;
  descricao: string;
}

function loadState(): Partial<PersistedState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveState(s: PersistedState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

export function QuickMode({ onSave }: QuickModeProps) {
  const { tipos } = useTiposAtendimento();
  const { clientes } = useClientes();
  const { servicos } = useServicos();

  const initial = loadState();
  const [ativo, setAtivo] = useState(initial.ativo ?? false);
  const [pausado, setPausado] = useState(initial.pausado ?? false);
  const [inicio, setInicio] = useState<Date | null>(initial.inicioISO ? new Date(initial.inicioISO) : null);
  const [cliente, setCliente] = useState(initial.cliente ?? '');
  const [tipo, setTipo] = useState(initial.tipo ?? '');
  const [servicoId, setServicoId] = useState(initial.servicoId ?? '');
  const [elapsed, setElapsed] = useState('00:00:00');
  const [pausaElapsed, setPausaElapsed] = useState('00:00:00');
  const [totalPausado, setTotalPausado] = useState(initial.totalPausado ?? 0);
  const [pausaInicio, setPausaInicio] = useState<Date | null>(initial.pausaInicioISO ? new Date(initial.pausaInicioISO) : null);
  const [descricao, setDescricao] = useState(initial.descricao ?? '');

  const fmtDur = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  // Persist on every change while active
  useEffect(() => {
    if (ativo) {
      saveState({
        ativo, pausado,
        inicioISO: inicio?.toISOString() ?? null,
        cliente, tipo, servicoId,
        totalPausado,
        pausaInicioISO: pausaInicio?.toISOString() ?? null,
        descricao,
      });
    }
  }, [ativo, pausado, inicio, cliente, tipo, servicoId, totalPausado, pausaInicio, descricao]);

  useEffect(() => {
    if (!tipo && tipos.length > 0) setTipo(tipos[0].id);
  }, [tipos, tipo]);

  useEffect(() => {
    if (!servicoId && servicos.length > 0) setServicoId(servicos[0].id);
  }, [servicos, servicoId]);

  useEffect(() => {
    if (!ativo || !inicio || pausado) return;
    const tick = () => {
      const diff = Date.now() - inicio.getTime() - totalPausado;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [ativo, inicio, pausado, totalPausado]);

  const iniciar = useCallback(() => {
    setInicio(new Date());
    setAtivo(true);
    setPausado(false);
    setTotalPausado(0);
  }, []);

  const pausar = useCallback(() => {
    setPausado(true);
    setPausaInicio(new Date());
  }, []);

  const retomar = useCallback(() => {
    if (pausaInicio) {
      setTotalPausado(prev => prev + (Date.now() - pausaInicio.getTime()));
    }
    setPausado(false);
    setPausaInicio(null);
  }, [pausaInicio]);

  const finalizar = useCallback(() => {
    if (!inicio) return;
    let pausaTotal = totalPausado;
    if (pausado && pausaInicio) {
      pausaTotal += Date.now() - pausaInicio.getTime();
    }

    const fim = new Date();
    const horaInicio = formatarHora(inicio);
    const horaFim = formatarHora(fim);
    const now = new Date().toISOString();

    const diffMs = fim.getTime() - inicio.getTime() - pausaTotal;
    const duracaoHoras = Math.max(0, parseFloat((diffMs / 3600000).toFixed(2)));

    const atendimento: Atendimento = {
      id: crypto.randomUUID(),
      cliente: cliente || 'Cliente não informado',
      descricao: descricao.trim(),
      tipo: tipo || 'SUPORTE',
      servico_id: servicoId || undefined,
      data: inicio.toISOString().split('T')[0],
      hora_inicio: horaInicio,
      hora_fim: horaFim,
      duracao_horas: duracaoHoras,
      status: 'REGISTRADO',
      observacoes: '',
      data_criacao: now,
      data_atualizacao: now,
    };

    onSave(atendimento);
    setAtivo(false);
    setPausado(false);
    setInicio(null);
    setCliente('');
    setDescricao('');
    setElapsed('00:00:00');
    setTotalPausado(0);
    setPausaInicio(null);
    clearState();
  }, [inicio, cliente, tipo, servicoId, descricao, onSave, totalPausado, pausado, pausaInicio]);

  const descartar = useCallback(() => {
    if (!confirm('Descartar atendimento em andamento?')) return;
    setAtivo(false);
    setPausado(false);
    setInicio(null);
    setDescricao('');
    setElapsed('00:00:00');
    setTotalPausado(0);
    setPausaInicio(null);
    clearState();
  }, []);

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {ativo && !pausado && <span className="w-2 h-2 rounded-full bg-destructive pulse-recording" />}
          {pausado && <span className="w-2 h-2 rounded-full bg-warning" />}
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Modo Rápido</span>
        </div>

        {clientes.length > 0 ? (
          <Select value={cliente} onValueChange={setCliente} disabled={ativo}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Selecione cliente" /></SelectTrigger>
            <SelectContent>
              {clientes.map(c => (
                <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-xs text-muted-foreground italic">Cadastre clientes primeiro</span>
        )}

        <Select value={tipo} onValueChange={setTipo} disabled={ativo}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            {tipos.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={servicoId} onValueChange={setServicoId} disabled={ativo}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Serviço" /></SelectTrigger>
          <SelectContent>
            {servicos.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {ativo && inicio && (
          <div className="flex items-center gap-3 font-mono text-lg text-primary font-bold">
            <span className="text-xs text-muted-foreground font-sans uppercase tracking-wider">Início</span>
            <span className="text-base">{formatarHora(inicio)}</span>
            <span className="text-muted-foreground">·</span>
            <Clock className="w-4 h-4" />
            {elapsed}
            {pausado && <span className="text-xs text-warning font-sans">(pausado)</span>}
          </div>
        )}

        <div className="flex items-center gap-1 ml-auto">
          {!ativo ? (
            <Button onClick={iniciar} size="sm" className="gap-1" disabled={clientes.length > 0 && !cliente}>
              <Play className="w-3 h-3" /> Iniciar
            </Button>
          ) : (
            <>
              {!pausado ? (
                <Button onClick={pausar} variant="outline" size="sm" className="gap-1">
                  <Pause className="w-3 h-3" /> Pausar
                </Button>
              ) : (
                <Button onClick={retomar} variant="outline" size="sm" className="gap-1">
                  <PlayCircle className="w-3 h-3" /> Retomar
                </Button>
              )}
              <Button onClick={finalizar} variant="destructive" size="sm" className="gap-1">
                <Square className="w-3 h-3" /> Finalizar
              </Button>
              <Button onClick={descartar} variant="ghost" size="sm" className="text-xs text-muted-foreground">
                Descartar
              </Button>
            </>
          )}
        </div>
      </div>

      {ativo && (
        <Textarea
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          placeholder="Anotações durante o atendimento..."
          rows={2}
          className="text-sm"
        />
      )}
    </div>
  );
}
