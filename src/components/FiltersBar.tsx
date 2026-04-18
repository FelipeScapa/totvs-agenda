import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { MultiSelect } from '@/components/MultiSelect';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { STATUS_FLOW, STATUS_LABELS } from '@/types/atendimento';
import { useClientes } from '@/hooks/use-clientes';
import { useServicos } from '@/hooks/use-servicos';

export interface FiltersState {
  dataInicio?: Date;
  dataFim?: Date;
  status: string[];
  clientes: string[];
  servicos: string[];
}

interface Props {
  filters: FiltersState;
  setFilters: (f: FiltersState) => void;
}

export function FiltersBar({ filters, setFilters }: Props) {
  const { clientes } = useClientes();
  const { servicos } = useServicos();

  const set = <K extends keyof FiltersState>(k: K, v: FiltersState[K]) =>
    setFilters({ ...filters, [k]: v });

  const tem = filters.dataInicio || filters.dataFim || filters.status.length || filters.clientes.length || filters.servicos.length;

  const limpar = () => setFilters({ status: [], clientes: [], servicos: [] });

  return (
    <div className="flex items-center gap-2 flex-wrap">
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
  return list.filter(a => {
    if (f.dataInicio && a.data < format(f.dataInicio, 'yyyy-MM-dd')) return false;
    if (f.dataFim && a.data > format(f.dataFim, 'yyyy-MM-dd')) return false;
    if (f.status.length && !f.status.includes(a.status)) return false;
    if (f.clientes.length && !f.clientes.includes(a.cliente)) return false;
    if (f.servicos.length && !f.servicos.includes(a.servico_id ?? '')) return false;
    return true;
  });
}
