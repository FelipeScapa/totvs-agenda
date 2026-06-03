import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { MultiSelect } from '@/components/MultiSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { STATUS_FLOW, STATUS_LABELS } from '@/types/atendimento';
import { useClientes } from '@/hooks/use-clientes';
import { useServicos } from '@/hooks/use-servicos';

export type FiltroModo = 'data' | 'fechamento';

export interface FiltersState {
  modo?: FiltroModo;
  // Modo data
  dataInicio?: Date;
  dataFim?: Date;
  // Modo fechamento (mês de referência - inicio dia 25 do mês anterior, fim dia 26 do mês ref)
  fechamentoRef?: Date;
  status: string[];
  clientes: string[];
  servicos: string[];
}

// Calcula intervalo do período de fechamento: dia 25 do mês anterior ao ref → dia 26 do mês ref (inclusive)
export function periodoFechamento(ref: Date): { inicio: string; fim: string; label: string } {
  const ano = ref.getFullYear();
  const mes = ref.getMonth();
  const inicio = new Date(ano, mes - 1, 26);
  const fim = new Date(ano, mes, 25);
  return {
    inicio: format(inicio, 'yyyy-MM-dd'),
    fim: format(fim, 'yyyy-MM-dd'),
    label: `${format(inicio, 'dd/MM/yy')} → ${format(fim, 'dd/MM/yy')}`,
  };
}

export function periodoFiltro(f: FiltersState): { inicio?: string; fim?: string } {
  const modo = f.modo ?? 'data';
  if (modo === 'data') {
    return {
      inicio: f.dataInicio ? format(f.dataInicio, 'yyyy-MM-dd') : undefined,
      fim: f.dataFim ? format(f.dataFim, 'yyyy-MM-dd') : undefined,
    };
  }
  if (f.fechamentoRef) {
    const p = periodoFechamento(f.fechamentoRef);
    return { inicio: p.inicio, fim: p.fim };
  }
  return {};
}

interface Props {
  filters: FiltersState;
  setFilters: (f: FiltersState) => void;
}

export function FiltersBar({ filters, setFilters }: Props) {
  const { clientes } = useClientes();
  const { servicos } = useServicos();
  const modo = filters.modo ?? 'data';

  const set = <K extends keyof FiltersState>(k: K, v: FiltersState[K]) =>
    setFilters({ ...filters, [k]: v });

  const tem = filters.dataInicio || filters.dataFim || filters.fechamentoRef || filters.status.length || filters.clientes.length || filters.servicos.length;

  const limpar = () => setFilters({ modo, status: [], clientes: [], servicos: [] });

  const ref = filters.fechamentoRef ?? new Date();
  const periodo = periodoFechamento(ref);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={modo} onValueChange={(v) => setFilters({ ...filters, modo: v as FiltroModo, dataInicio: undefined, dataFim: undefined, fechamentoRef: undefined })}>
        <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="data">Por data</SelectItem>
          <SelectItem value="fechamento">Por fechamento</SelectItem>
        </SelectContent>
      </Select>

      {modo === 'data' ? (
        <>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("w-32 justify-start text-left text-xs h-8", !filters.dataInicio && "text-muted-foreground")}>
                <CalendarIcon className="mr-1 h-3 w-3" />
                {filters.dataInicio ? format(filters.dataInicio, "dd/MM/yyyy") : "Início"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={filters.dataInicio} onSelect={(d) => set('dataInicio', d)} locale={ptBR} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground text-xs">até</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("w-32 justify-start text-left text-xs h-8", !filters.dataFim && "text-muted-foreground")}>
                <CalendarIcon className="mr-1 h-3 w-3" />
                {filters.dataFim ? format(filters.dataFim, "dd/MM/yyyy") : "Fim"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={filters.dataFim} onSelect={(d) => set('dataFim', d)} locale={ptBR} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </>
      ) : (
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => set('fechamentoRef', subMonths(ref, 1))}>
            <ChevronLeft className="w-3 h-3" />
          </Button>
          <div className="text-xs h-8 px-3 flex flex-col items-center justify-center bg-secondary/50 rounded border border-border min-w-[150px]">
            <span className="font-mono">{periodo.label}</span>
            <span className="text-[10px] text-muted-foreground capitalize">{format(ref, "MMM/yy", { locale: ptBR })}</span>
          </div>
          <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => set('fechamentoRef', addMonths(ref, 1))}>
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      )}

      <MultiSelect
        options={clientes.map(c => ({ value: c.nome, label: c.nome }))}
        selected={filters.clientes}
        onChange={(v) => set('clientes', v)}
        placeholder="Clientes"
        className="w-40"
      />
      <MultiSelect
        options={servicos.map(s => ({ value: s.id, label: s.nome }))}
        selected={filters.servicos}
        onChange={(v) => set('servicos', v)}
        placeholder="Serviços"
        className="w-36"
      />
      <MultiSelect
        options={STATUS_FLOW.map(s => ({ value: s, label: STATUS_LABELS[s] }))}
        selected={filters.status}
        onChange={(v) => set('status', v)}
        placeholder="Status"
        className="w-40"
      />
      {tem && (
        <Button variant="ghost" size="sm" onClick={limpar} className="h-8 px-2">
          <X className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}

export function aplicarFiltros<T extends { data: string; status: string; cliente: string; servico_id?: string }>(
  list: T[],
  f: FiltersState
): T[] {
  const modo = f.modo ?? 'data';
  let inicio: string | undefined;
  let fim: string | undefined;
  if (modo === 'data') {
    if (f.dataInicio) inicio = format(f.dataInicio, 'yyyy-MM-dd');
    if (f.dataFim) fim = format(f.dataFim, 'yyyy-MM-dd');
  } else if (f.fechamentoRef) {
    const p = periodoFechamento(f.fechamentoRef);
    inicio = p.inicio; fim = p.fim;
  }
  return list.filter(a => {
    if (inicio && a.data < inicio) return false;
    if (fim && a.data > fim) return false;
    if (f.status.length && !f.status.includes(a.status)) return false;
    if (f.clientes.length && !f.clientes.includes(a.cliente)) return false;
    if (f.servicos.length && !f.servicos.includes(a.servico_id ?? '')) return false;
    return true;
  });
}
