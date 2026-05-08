import { useState, useMemo } from 'react';
import { Atendimento } from '@/types/atendimento';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Clock, DollarSign, FileText, Coffee, Eye, EyeOff, Plane, TrendingUp, PartyPopper, AlertTriangle, Timer } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useServicos } from '@/hooks/use-servicos';
import { useFeriados } from '@/hooks/use-feriados';
import { calcularValor, calcularStatusPrazo } from '@/lib/atendimento-utils';
import { FiltersBar, FiltersState, aplicarFiltros, periodoFiltro } from '@/components/FiltersBar';
import { STATUS_FLOW, STATUS_LABELS } from '@/types/atendimento';

interface CalendarViewProps {
  atendimentos: Atendimento[];
  onAtendimentoClick?: (a: Atendimento) => void;
  filters: FiltersState;
  setFilters: (f: FiltersState) => void;
  ocultarValores: boolean;
  onToggleOcultar: () => void;
}

type ViewMode = 'mes' | 'semana' | 'dia';

const COLOR_PALETTE = [
  'bg-blue-500/30 border-blue-500/60 text-blue-100',
  'bg-emerald-500/30 border-emerald-500/60 text-emerald-100',
  'bg-purple-500/30 border-purple-500/60 text-purple-100',
  'bg-amber-500/30 border-amber-500/60 text-amber-100',
  'bg-cyan-500/30 border-cyan-500/60 text-cyan-100',
  'bg-pink-500/30 border-pink-500/60 text-pink-100',
  'bg-orange-500/30 border-orange-500/60 text-orange-100',
];

function colorForCliente(cliente: string): string {
  let hash = 0;
  for (let i = 0; i < cliente.length; i++) hash = (hash * 31 + cliente.charCodeAt(i)) | 0;
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
}

export function CalendarView({ atendimentos, onAtendimentoClick, filters, setFilters, ocultarValores, onToggleOcultar }: CalendarViewProps) {
  const [view, setView] = useState<ViewMode>('mes');
  const [cursor, setCursor] = useState<Date>(new Date());
  const { servicos } = useServicos();
  const { isDiaNaoComputado, getFeriado, isDiaForaPrevisao } = useFeriados();

  const filtrados = useMemo(() => aplicarFiltros(atendimentos, filters), [atendimentos, filters]);

  const getValorHora = (a: Atendimento) => {
    if (a.servico_id) {
      const s = servicos.find(x => x.id === a.servico_id);
      if (s) return s.valor_hora;
    }
    return 26;
  };

  const stats = useMemo(() => {
    const totalHoras = filtrados.reduce((s, a) => s + a.duracao_horas, 0);
    const valorTotal = filtrados.reduce((s, a) => s + calcularValor(a.duracao_horas, getValorHora(a)), 0);
    const counts: Record<string, number> = {};
    STATUS_FLOW.forEach(s => counts[s] = 0);
    filtrados.forEach(a => { counts[a.status] = (counts[a.status] ?? 0) + 1; });

    const pendentes = filtrados.filter(a => a.status !== 'APONTADO').length;
    const atrasados = filtrados.filter(a => a.status !== 'APONTADO' && calcularStatusPrazo(a.data) === 'ATRASADO').length;

    return { total: filtrados.length, totalHoras, valorTotal, pendentes, atrasados, counts };
  }, [filtrados, servicos]);

  const previsao = useMemo(() => {
    const p = periodoFiltro(filters);
    if (!p.inicio || !p.fim) return null;
    const start = new Date(p.inicio + 'T00:00:00');
    const end = new Date(p.fim + 'T00:00:00');
    let dias = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const dow = cur.getDay();
      const iso = cur.toISOString().slice(0, 10);
      if (dow >= 1 && dow <= 5 && !isDiaForaPrevisao(iso)) dias++;
      cur.setDate(cur.getDate() + 1);
    }
    return { dias, horas: dias * 8, valor: dias * 8 * 26 };
  }, [filters, isDiaForaPrevisao]);

  const byDate = useMemo(() => {
    const map = new Map<string, Atendimento[]>();
    filtrados.forEach(a => {
      const list = map.get(a.data) ?? [];
      list.push(a);
      map.set(a.data, list);
    });
    map.forEach(list => list.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)));
    return map;
  }, [filtrados]);

  const navigate = (dir: number) => {
    if (view === 'mes') setCursor(dir > 0 ? addMonths(cursor, 1) : subMonths(cursor, 1));
    else if (view === 'semana') setCursor(dir > 0 ? addWeeks(cursor, 1) : subWeeks(cursor, 1));
    else setCursor(addDays(cursor, dir));
  };

  const titulo = useMemo(() => {
    if (view === 'mes') return format(cursor, "MMMM 'de' yyyy", { locale: ptBR });
    if (view === 'semana') {
      const start = startOfWeek(cursor, { weekStartsOn: 0 });
      const end = endOfWeek(cursor, { weekStartsOn: 0 });
      return `${format(start, 'dd MMM', { locale: ptBR })} – ${format(end, 'dd MMM yyyy', { locale: ptBR })}`;
    }
    return format(cursor, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }, [cursor, view]);

  return (
    <div className="space-y-4">
      {/* Toggle ocultar */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={onToggleOcultar} className="gap-1 text-xs text-muted-foreground">
          {!ocultarValores ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          {!ocultarValores ? 'Ocultar valores' : 'Mostrar valores'}
        </Button>
      </div>

      {/* Dashboard cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={FileText} label="Atendimentos" value={String(stats.total)} />
        {/* Mesclado: Horas + Valor */}
        <div className="glass-card p-3 space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Horas / Valor</span>
          </div>
          <p className="text-xl font-bold text-primary">{stats.totalHoras.toFixed(1)}<span className="text-xs text-muted-foreground ml-1">h</span></p>
          <p className="text-sm font-semibold text-primary/80">{ocultarValores ? '••••••' : `R$ ${stats.valorTotal.toFixed(2)}`}</p>
        </div>
        <StatCard icon={Timer} label="Pendentes" value={String(stats.pendentes)} color="text-muted-foreground" />
        <StatCard icon={AlertTriangle} label="Atrasados" value={String(stats.atrasados)} color="text-destructive" />
        {/* Previsão */}
        <div className="glass-card p-3 space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Previsão</span>
          </div>
          {previsao ? (
            <>
              <p className="text-xl font-bold text-emerald-400">{previsao.horas}<span className="text-xs text-muted-foreground ml-1">h</span></p>
              <p className="text-sm font-semibold text-emerald-400/80">{ocultarValores ? '••••••' : `R$ ${previsao.valor.toFixed(2)}`}</p>
              <p className="text-[10px] text-muted-foreground">{previsao.dias}d × 8h</p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground pt-2">Defina um período</p>
          )}
        </div>
      </div>

      {/* Status totalizer */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FLOW.map(s => (
          <button
            key={s}
            onClick={() => setFilters({ ...filters, status: filters.status.includes(s) ? filters.status.filter(x => x !== s) : [...filters.status, s] })}
            className={cn("glass-card px-3 py-2 flex items-center gap-2 transition-all hover:scale-[1.02]", filters.status.includes(s) && 'ring-2 ring-primary')}
          >
            <Badge variant="outline" className="text-xs">{STATUS_LABELS[s]}</Badge>
            <span className="font-bold">{stats.counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-3">
        <FiltersBar filters={filters} setFilters={setFilters} />
      </div>

      {/* Calendar nav */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Hoje</Button>
          <Button variant="outline" size="sm" onClick={() => navigate(1)}><ChevronRight className="w-4 h-4" /></Button>
          <h2 className="text-base font-semibold capitalize ml-2">{titulo}</h2>
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="mes">Mês</TabsTrigger>
            <TabsTrigger value="semana">Semana</TabsTrigger>
            <TabsTrigger value="dia">Dia</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === 'mes' && <MesView cursor={cursor} byDate={byDate} onClick={onAtendimentoClick} getFeriado={getFeriado} />}
      {view === 'semana' && <SemanaView cursor={cursor} byDate={byDate} onClick={onAtendimentoClick} getFeriado={getFeriado} />}
      {view === 'dia' && <DiaView cursor={cursor} byDate={byDate} onClick={onAtendimentoClick} getFeriado={getFeriado} />}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = 'text-foreground' }: { icon: any; label: string; value: string; color?: string }) {
  return (
    <div className="glass-card p-3 space-y-1">
      <div className="flex items-center gap-2">
        <Icon className={cn("w-4 h-4", color)} />
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn("text-xl font-bold", color)}>{value}</p>
    </div>
  );
}

function RankingCard({ title, rows }: { title: string; rows: [string, { horas: number; valor: number; count: number }][] }) {
  const max = Math.max(1, ...rows.map(r => r[1].horas));
  return (
    <div className="glass-card p-3 space-y-2">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</h3>
      {rows.length === 0 && <p className="text-xs text-muted-foreground">Sem dados</p>}
      {rows.map(([name, v]) => (
        <div key={name} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="truncate font-medium">{name}</span>
            <span className="text-muted-foreground">{v.horas.toFixed(1)}h · R$ {v.valor.toFixed(0)} · {v.count}x</span>
          </div>
          <div className="h-1.5 bg-secondary/30 rounded overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${(v.horas / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

type GetFeriado = (data: string) => { tipo: 'FERIAS' | 'FERIADO' | 'FOLGA'; descricao: string } | null;

function feriadoStyles(tipo: 'FERIAS' | 'FERIADO' | 'FOLGA') {
  if (tipo === 'FERIAS') return { bg: 'bg-cyan-500/10 ring-cyan-500/40', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', icon: Plane, label: 'Férias' };
  if (tipo === 'FOLGA') return { bg: 'bg-amber-500/10 ring-amber-500/40', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: Coffee, label: 'Folga' };
  return { bg: 'bg-purple-500/10 ring-purple-500/40', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: PartyPopper, label: 'Feriado' };
}

function MesView({ cursor, byDate, onClick, getFeriado }: { cursor: Date; byDate: Map<string, Atendimento[]>; onClick?: (a: Atendimento) => void; getFeriado: GetFeriado }) {
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const start = startOfWeek(monthStart, { weekStartsOn: 0 });
  const end = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days: Date[] = [];
  let d = start;
  while (d <= end) { days.push(d); d = addDays(d, 1); }

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="glass-card p-3">
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map(w => (
          <div key={w} className="text-xs font-medium text-muted-foreground text-center py-1 uppercase tracking-wider">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const items = byDate.get(key) ?? [];
          const inMonth = isSameMonth(day, cursor);
          const isToday = isSameDay(day, new Date());
          const feriado = getFeriado(key);
          const fs = feriado ? feriadoStyles(feriado.tipo) : null;
          return (
            <div key={key} className={cn(
              "min-h-[90px] rounded p-1.5 border border-border/30 flex flex-col gap-0.5",
              inMonth ? "bg-secondary/20" : "bg-secondary/5 opacity-50",
              fs && `${fs.bg} ring-1`,
              isToday && "ring-2 ring-primary"
            )}>
              <div className="flex items-center justify-between gap-1">
                <span className={cn("text-xs font-medium", isToday && "text-primary font-bold")}>{format(day, 'd')}</span>
                {fs && <fs.icon className="w-3 h-3 opacity-70" />}
              </div>
              {fs && (
                <span className={cn("text-[9px] px-1 rounded border truncate", fs.badge)} title={feriado!.descricao}>
                  {fs.label}
                </span>
              )}
              {items.slice(0, 3).map(a => (
                <button
                  key={a.id}
                  onClick={() => onClick?.(a)}
                  className={cn("text-[10px] px-1 py-0.5 rounded border truncate text-left", colorForCliente(a.cliente))}
                  title={`${a.hora_inicio}–${a.hora_fim} ${a.cliente}`}
                >
                  {a.hora_inicio} {a.cliente}
                </button>
              ))}
              {items.length > 3 && (
                <span className="text-[10px] text-muted-foreground">+{items.length - 3} mais</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SemanaView({ cursor, byDate, onClick, getFeriado }: { cursor: Date; byDate: Map<string, Atendimento[]>; onClick?: (a: Atendimento) => void; getFeriado: GetFeriado }) {
  const start = startOfWeek(cursor, { weekStartsOn: 0 });
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) days.push(addDays(start, i));

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map(day => {
        const key = format(day, 'yyyy-MM-dd');
        const items = byDate.get(key) ?? [];
        const isToday = isSameDay(day, new Date());
        const feriado = getFeriado(key);
        const fs = feriado ? feriadoStyles(feriado.tipo) : null;
        return (
          <div key={key} className={cn("glass-card p-2 min-h-[200px] flex flex-col gap-1", fs && `${fs.bg} ring-1`, isToday && "ring-2 ring-primary")}>
            <div className="text-center mb-1">
              <div className="text-xs text-muted-foreground uppercase">{format(day, 'EEE', { locale: ptBR })}</div>
              <div className={cn("text-lg font-bold", isToday && "text-primary")}>{format(day, 'd')}</div>
            </div>
            {fs && (
              <div className={cn("flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border justify-center", fs.badge)} title={feriado!.descricao}>
                <fs.icon className="w-3 h-3" /> {fs.label}
              </div>
            )}
            {items.map(a => (
              <button
                key={a.id}
                onClick={() => onClick?.(a)}
                className={cn("text-[11px] p-1.5 rounded border text-left", colorForCliente(a.cliente))}
              >
                <div className="font-mono">{a.hora_inicio}–{a.hora_fim}</div>
                <div className="font-semibold truncate">{a.cliente}</div>
                {a.descricao && <div className="opacity-80 truncate">{a.descricao}</div>}
              </button>
            ))}
            {items.length === 0 && !fs && <div className="text-xs text-muted-foreground text-center mt-4">—</div>}
          </div>
        );
      })}
    </div>
  );
}

const HOUR_PX = 40; // 24h * 40 = 960px

function toMin(t: string) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }

function DiaView({ cursor, byDate, onClick, getFeriado }: { cursor: Date; byDate: Map<string, Atendimento[]>; onClick?: (a: Atendimento) => void; getFeriado: GetFeriado }) {
  const key = format(cursor, 'yyyy-MM-dd');
  const items = byDate.get(key) ?? [];
  const feriado = getFeriado(key);
  const fs = feriado ? feriadoStyles(feriado.tipo) : null;
  const hours = Array.from({ length: 24 }, (_, i) => i); // 0–23

  // Build segments: for each atendimento, split at intervalo (if any) into one or two segments + a 'pausa' segment
  type Seg = { kind: 'work' | 'pausa'; start: number; end: number; a: Atendimento };
  const segments: Seg[] = [];
  items.forEach(a => {
    const ini = toMin(a.hora_inicio);
    const fim = toMin(a.hora_fim);
    if (a.intervalo_inicio && a.intervalo_fim) {
      const ii = toMin(a.intervalo_inicio);
      const ff = toMin(a.intervalo_fim);
      if (ii > ini && ff < fim && ii < ff) {
        segments.push({ kind: 'work', start: ini, end: ii, a });
        segments.push({ kind: 'pausa', start: ii, end: ff, a });
        segments.push({ kind: 'work', start: ff, end: fim, a });
        return;
      }
    }
    segments.push({ kind: 'work', start: ini, end: fim, a });
  });

  const px = (min: number) => (min / 60) * HOUR_PX;

  return (
    <div className={cn("glass-card p-3", fs && `${fs.bg} ring-1`)}>
      {fs && (
        <div className={cn("flex items-center gap-2 px-3 py-2 mb-2 rounded border", fs.badge)}>
          <fs.icon className="w-4 h-4" />
          <span className="font-semibold">{fs.label}</span>
          <span className="text-xs opacity-80">· {feriado!.descricao}</span>
        </div>
      )}
      <div className="relative" style={{ height: `${24 * HOUR_PX}px` }}>
        {hours.map(h => (
          <div key={h} className="absolute left-0 right-0 border-t border-border/30 flex" style={{ top: `${h * HOUR_PX}px` }}>
            <span className="text-xs text-muted-foreground w-12 -mt-2 font-mono">{String(h).padStart(2, '0')}:00</span>
          </div>
        ))}
        <div className="absolute left-14 right-0 top-0 bottom-0">
          {segments.map((seg, idx) => (
            <button
              key={`${seg.a.id}-${idx}`}
              onClick={() => onClick?.(seg.a)}
              className={cn(
                "absolute left-0 right-0 rounded border p-1.5 text-left text-xs overflow-hidden",
                seg.kind === 'work'
                  ? colorForCliente(seg.a.cliente)
                  : "bg-muted/40 border-dashed border-muted-foreground/40 text-muted-foreground"
              )}
              style={{ top: `${px(seg.start)}px`, height: `${Math.max(20, px(seg.end - seg.start))}px` }}
              title={seg.kind === 'pausa' ? 'Intervalo' : `${seg.a.hora_inicio}–${seg.a.hora_fim} ${seg.a.cliente}`}
            >
              {seg.kind === 'pausa' ? (
                <div className="flex items-center gap-1">
                  <Coffee className="w-3 h-3" />
                  <span className="font-mono">{seg.a.intervalo_inicio}–{seg.a.intervalo_fim}</span>
                  <span className="opacity-70">intervalo</span>
                </div>
              ) : (
                <>
                  <div className="font-mono">{minToHHMM(seg.start)}–{minToHHMM(seg.end)}</div>
                  <div className="font-semibold truncate">{seg.a.cliente}</div>
                  {seg.a.descricao && <div className="opacity-80 truncate">{seg.a.descricao}</div>}
                </>
              )}
            </button>
          ))}
          {items.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              Sem atendimentos neste dia
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function minToHHMM(min: number) {
  const h = Math.floor(min / 60), m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
