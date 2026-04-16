import { useState, useMemo } from 'react';
import { useAtendimentos } from '@/hooks/use-atendimentos';
import { DashboardCards } from '@/components/DashboardCards';
import { QuickMode } from '@/components/QuickMode';
import { AtendimentoList } from '@/components/AtendimentoList';
import { AtendimentoForm } from '@/components/AtendimentoForm';
import { ClienteManager } from '@/components/ClienteManager';
import { TipoManager } from '@/components/TipoManager';
import { ServicoManager } from '@/components/ServicoManager';
import { Atendimento } from '@/types/atendimento';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Plus, Activity, Users, Tag, X, Briefcase, Filter } from 'lucide-react';
import { STATUS_LABELS, STATUS_FLOW } from '@/types/atendimento';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const Index = () => {
  const { atendimentos, adicionar, atualizar, remover } = useAtendimentos();
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Atendimento | null>(null);
  const [clienteOpen, setClienteOpen] = useState(false);
  const [tipoOpen, setTipoOpen] = useState(false);
  const [servicoOpen, setServicoOpen] = useState(false);
  const [filtroDataInicio, setFiltroDataInicio] = useState<Date | undefined>();
  const [filtroDataFim, setFiltroDataFim] = useState<Date | undefined>();
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [ocultarValores, setOcultarValores] = useState(false);

  const atendimentosFiltrados = useMemo(() => {
    return atendimentos
      .filter(a => {
        if (filtroDataInicio) {
          const inicio = format(filtroDataInicio, 'yyyy-MM-dd');
          if (a.data < inicio) return false;
        }
        if (filtroDataFim) {
          const fim = format(filtroDataFim, 'yyyy-MM-dd');
          if (a.data > fim) return false;
        }
        if (filtroStatus !== 'TODOS' && a.status !== filtroStatus) return false;
        return true;
      })
      .sort((a, b) => a.data.localeCompare(b.data) || a.hora_inicio.localeCompare(b.hora_inicio));
  }, [atendimentos, filtroDataInicio, filtroDataFim, filtroStatus]);

  const handleEdit = (a: Atendimento) => {
    setEditando(a);
    setFormOpen(true);
  };

  const handleSave = (a: Atendimento) => {
    if (editando) {
      atualizar(a.id, a);
    } else {
      adicionar(a);
    }
    setEditando(null);
  };

  const handleStatusChange = (id: string, status: Atendimento['status']) => {
    atualizar(id, { status });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">agenda-log</h1>
            <span className="text-xs text-muted-foreground font-mono">rastreador de trabalho faturável</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setClienteOpen(true)} className="gap-1">
              <Users className="w-4 h-4" /> Clientes
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setTipoOpen(true)} className="gap-1">
              <Tag className="w-4 h-4" /> Tipos
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setServicoOpen(true)} className="gap-1">
              <Briefcase className="w-4 h-4" /> Serviços
            </Button>
            <Button size="sm" onClick={() => { setEditando(null); setFormOpen(true); }} className="gap-1">
              <Plus className="w-4 h-4" /> Novo
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <QuickMode onSave={adicionar} />
        <DashboardCards atendimentos={atendimentosFiltrados} ocultarValores={ocultarValores} onToggleOcultar={() => setOcultarValores(v => !v)} />
        <div>
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Atendimentos ({atendimentosFiltrados.length})
            </h2>
            <div className="flex items-center gap-2 ml-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-36 justify-start text-left text-xs h-8", !filtroDataInicio && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {filtroDataInicio ? format(filtroDataInicio, "dd/MM/yyyy") : "Data início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={filtroDataInicio} onSelect={setFiltroDataInicio} locale={ptBR} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground text-xs">até</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-36 justify-start text-left text-xs h-8", !filtroDataFim && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {filtroDataFim ? format(filtroDataFim, "dd/MM/yyyy") : "Data fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={filtroDataFim} onSelect={setFiltroDataFim} locale={ptBR} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <Filter className="w-3 h-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os status</SelectItem>
                  {STATUS_FLOW.map(s => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(filtroDataInicio || filtroDataFim || filtroStatus !== 'TODOS') && (
                <Button variant="ghost" size="sm" onClick={() => { setFiltroDataInicio(undefined); setFiltroDataFim(undefined); setFiltroStatus('TODOS'); }} className="h-8 px-2">
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
          <AtendimentoList
            atendimentos={atendimentosFiltrados}
            onEdit={handleEdit}
            onDelete={remover}
            onStatusChange={handleStatusChange}
            ocultarValores={ocultarValores}
          />
        </div>
      </main>

      <AtendimentoForm
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditando(null); }}
        onSave={handleSave}
        editando={editando}
      />
      <ClienteManager open={clienteOpen} onOpenChange={setClienteOpen} />
      <TipoManager open={tipoOpen} onOpenChange={setTipoOpen} />
      <ServicoManager open={servicoOpen} onOpenChange={setServicoOpen} />
    </div>
  );
};

export default Index;
