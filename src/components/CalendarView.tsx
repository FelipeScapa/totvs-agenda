import { useState, useMemo } from 'react';
import { Atendimento } from '@/types/atendimento';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useServicos } from '@/hooks/use-servicos';

interface CalendarViewProps {
  atendimentos: Atendimento[];
  onAtendimentoClick?: (a: Atendimento) => void;
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

export function CalendarView({ atendimentos, onAtendimentoClick }: CalendarViewProps) {
  const [view, setView] = useState<ViewMode>('mes');
  const [cursor, setCursor] = useState<Date>(new Date());
  const { servicos } = useServicos();

  const byDate = useMemo(() => {
    const map = new Map<string, Atendimento[]>();
    atendimentos.forEach(a => {
      const list = map.get(a.data) ?? [];
      list.push(a);
      map.set(a.data, list);
    });
    map.forEach(list => list.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)));
    return map;
  }, [atendimentos]);

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
    <div className="space-y-3">
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

      {view === 'mes' && <MesView cursor={cursor} byDate={byDate} onClick={onAtendimentoClick} />}
      {view === 'semana' && <SemanaView cursor={cursor} byDate={byDate} onClick={onAtendimentoClick} servicos={servicos} />}
      {view === 'dia' && <DiaView cursor={cursor} byDate={byDate} onClick={onAtendimentoClick} servicos={servicos} />}
    </div>
  );
}

function MesView({ cursor, byDate, onClick }: { cursor: Date; byDate: Map<string, Atendimento[]>; onClick?: (a: Atendimento) => void }) {
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
          return (
            <div key={key} className={cn(
              "min-h-[90px] rounded p-1.5 border border-border/30 flex flex-col gap-0.5",
              inMonth ? "bg-secondary/20" : "bg-secondary/5 opacity-50",
              isToday && "ring-1 ring-primary"
            )}>
              <div className={cn("text-xs font-medium", isToday && "text-primary font-bold")}>{format(day, 'd')}</div>
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

function SemanaView({ cursor, byDate, onClick, servicos }: { cursor: Date; byDate: Map<string, Atendimento[]>; onClick?: (a: Atendimento) => void; servicos: any[] }) {
  const start = startOfWeek(cursor, { weekStartsOn: 0 });
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) days.push(addDays(start, i));

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map(day => {
        const key = format(day, 'yyyy-MM-dd');
        const items = byDate.get(key) ?? [];
        const isToday = isSameDay(day, new Date());
        return (
          <div key={key} className={cn("glass-card p-2 min-h-[200px] flex flex-col gap-1", isToday && "ring-1 ring-primary")}>
            <div className="text-center mb-1">
              <div className="text-xs text-muted-foreground uppercase">{format(day, 'EEE', { locale: ptBR })}</div>
              <div className={cn("text-lg font-bold", isToday && "text-primary")}>{format(day, 'd')}</div>
            </div>
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
            {items.length === 0 && <div className="text-xs text-muted-foreground text-center mt-4">—</div>}
          </div>
        );
      })}
    </div>
  );
}

function DiaView({ cursor, byDate, onClick, servicos }: { cursor: Date; byDate: Map<string, Atendimento[]>; onClick?: (a: Atendimento) => void; servicos: any[] }) {
  const key = format(cursor, 'yyyy-MM-dd');
  const items = byDate.get(key) ?? [];
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7h–20h

  const itemTop = (hora: string) => {
    const [h, m] = hora.split(':').map(Number);
    return ((h - 7) * 60 + m) * (60 / 60); // 60px por hora
  };
  const itemHeight = (a: Atendimento) => {
    const [hi, mi] = a.hora_inicio.split(':').map(Number);
    const [hf, mf] = a.hora_fim.split(':').map(Number);
    return Math.max(24, ((hf * 60 + mf) - (hi * 60 + mi)));
  };

  return (
    <div className="glass-card p-3">
      <div className="relative" style={{ height: `${hours.length * 60}px` }}>
        {hours.map((h, i) => (
          <div key={h} className="absolute left-0 right-0 border-t border-border/30 flex" style={{ top: `${i * 60}px` }}>
            <span className="text-xs text-muted-foreground w-12 -mt-2 font-mono">{String(h).padStart(2, '0')}:00</span>
          </div>
        ))}
        <div className="absolute left-14 right-0 top-0 bottom-0">
          {items.map(a => (
            <button
              key={a.id}
              onClick={() => onClick?.(a)}
              className={cn("absolute left-0 right-0 rounded border p-1.5 text-left text-xs overflow-hidden", colorForCliente(a.cliente))}
              style={{ top: `${itemTop(a.hora_inicio)}px`, height: `${itemHeight(a)}px` }}
            >
              <div className="font-mono">{a.hora_inicio}–{a.hora_fim}</div>
              <div className="font-semibold">{a.cliente}</div>
              {a.descricao && <div className="opacity-80 truncate">{a.descricao}</div>}
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
