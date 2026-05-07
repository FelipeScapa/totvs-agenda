import { useState, useMemo } from 'react';
import { useAtendimentos } from '@/hooks/use-atendimentos';
import { DashboardCards } from '@/components/DashboardCards';
import { QuickMode } from '@/components/QuickMode';
import { AtendimentoList } from '@/components/AtendimentoList';
import { AtendimentoForm } from '@/components/AtendimentoForm';
import { ClienteManager } from '@/components/ClienteManager';
import { TipoManager } from '@/components/TipoManager';
import { ServicoManager } from '@/components/ServicoManager';
import { PendenciasView } from '@/components/PendenciasView';
import { CalendarView } from '@/components/CalendarView';
import { FiltersBar, FiltersState, aplicarFiltros, periodoFiltro } from '@/components/FiltersBar';
import { Atendimento } from '@/types/atendimento';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Activity, Users, Tag, Briefcase, Copy, ListTodo, CalendarRange, Wallet, Database, Plane } from 'lucide-react';
import { BackupManager } from '@/components/BackupManager';
import { FeriadosManager } from '@/components/FeriadosManager';
import { FinanceiroApp } from '@/components/financeiro/FinanceiroApp';
import { STATUS_LABELS, STATUS_FLOW } from '@/types/atendimento';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { gerarTextoAgenda } from '@/lib/atendimento-utils';

const STATUS_DOT: Record<string, string> = {
  REGISTRADO: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  EMAIL_ENVIADO: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  AGENDA_CRIADA: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  APONTADO: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const Index = () => {
  const { atendimentos, adicionar, atualizar, remover } = useAtendimentos();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Atendimento | null>(null);
  const [clienteOpen, setClienteOpen] = useState(false);
  const [tipoOpen, setTipoOpen] = useState(false);
  const [servicoOpen, setServicoOpen] = useState(false);
  const [filters, setFilters] = useState<FiltersState>({ status: [], clientes: [], servicos: [] });
  const [ocultarValores, setOcultarValores] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [feriadosOpen, setFeriadosOpen] = useState(false);
  const [appTab, setAppTab] = useState<'agenda' | 'financeiro'>('agenda');

  const atendimentosFiltrados = useMemo(() => {
    return aplicarFiltros(atendimentos, filters)
      .sort((a, b) => a.data.localeCompare(b.data) || a.hora_inicio.localeCompare(b.hora_inicio));
  }, [atendimentos, filters]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STATUS_FLOW.forEach(s => counts[s] = 0);
    atendimentosFiltrados.forEach(a => { counts[a.status] = (counts[a.status] ?? 0) + 1; });
    return counts;
  }, [atendimentosFiltrados]);

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

  const handleDuplicate = (a: Atendimento) => {
    const now = new Date().toISOString();
    adicionar({
      ...a,
      id: crypto.randomUUID(),
      status: 'REGISTRADO',
      data_criacao: now,
      data_atualizacao: now,
    });
    toast({ title: 'Duplicado!', description: 'Atendimento duplicado com sucesso.' });
  };

  const handleStatusChange = (id: string, status: Atendimento['status']) => {
    atualizar(id, { status });
  };

  const toggleStatusFiltro = (s: string) => {
    setFilters({ ...filters, status: filters.status.includes(s) ? filters.status.filter(x => x !== s) : [...filters.status, s] });
  };

  const copiarTudoAgenda = async () => {
    if (atendimentosFiltrados.length === 0) {
      toast({ title: 'Nada para copiar', description: 'Nenhum atendimento no filtro atual.' });
      return;
    }
    const grupos = new Map<string, typeof atendimentosFiltrados>();
    atendimentosFiltrados.forEach(a => {
      const arr = grupos.get(a.cliente) ?? [];
      arr.push(a);
      grupos.set(a.cliente, arr);
    });
    const formatarData = (d: string) => { const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y}`; };
    const partes: string[] = [];
    grupos.forEach((lista, cliente) => {
      partes.push(`Cliente: ${cliente}`);
      lista
        .sort((a, b) => a.data.localeCompare(b.data) || a.hora_inicio.localeCompare(b.hora_inicio))
        .forEach(a => {
          partes.push(`${formatarData(a.data)} - ${a.hora_inicio} às ${a.hora_fim} (${a.duracao_horas}h)`);
        });
      partes.push('');
    });
    
    toast({ title: 'Copiado!', description: `${atendimentosFiltrados.length} agendas agrupadas por clientes.` });
    alert('final');
    
    const texto = partes.join('\n').trimEnd();
    alert(texto);

    const textarea = document.createElement('textarea');
    
    textarea.value = texto;
    
    document.body.appendChild(textarea);
    
    textarea.select();
    
    document.execCommand('copy');
    
    document.body.removeChild(textarea);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">agenda-log</h1>
            <span className="text-xs text-muted-foreground font-mono hidden md:inline">rastreador + financeiro pessoal</span>
            <div className="ml-3 flex items-center bg-muted rounded p-0.5">
              <button onClick={() => setAppTab('agenda')} className={cn("px-3 py-1 rounded text-xs", appTab === 'agenda' && 'bg-background shadow-sm')}>Agenda</button>
              <button onClick={() => setAppTab('financeiro')} className={cn("px-3 py-1 rounded text-xs gap-1 inline-flex items-center", appTab === 'financeiro' && 'bg-background shadow-sm')}><Wallet className="w-3 h-3" /> Financeiro</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setFeriadosOpen(true)} className="gap-1" title="Férias e Feriados">
              <Plane className="w-4 h-4" /> <span className="hidden md:inline">Férias/Feriados</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setBackupOpen(true)} className="gap-1" title="Backup / Restaurar">
              <Database className="w-4 h-4" /> <span className="hidden md:inline">Backup</span>
            </Button>
            {appTab === 'agenda' && <>
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
            </>}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {appTab === 'financeiro' ? <FinanceiroApp /> : (
        <Tabs defaultValue="atendimentos">
          <TabsList>
            <TabsTrigger value="atendimentos" className="gap-1"><Activity className="w-4 h-4" /> Atendimentos</TabsTrigger>
            <TabsTrigger value="calendario" className="gap-1"><CalendarRange className="w-4 h-4" /> Calendário</TabsTrigger>
            <TabsTrigger value="pendencias" className="gap-1"><ListTodo className="w-4 h-4" /> Pendências</TabsTrigger>
          </TabsList>

          <TabsContent value="atendimentos" className="space-y-6">
            <QuickMode onSave={adicionar} />
            <DashboardCards atendimentos={atendimentosFiltrados} ocultarValores={ocultarValores} onToggleOcultar={() => setOcultarValores(v => !v)} periodo={periodoFiltro(filters)} />

            {/* Totalizador de status (clicável - multi) */}
            <div className="flex flex-wrap gap-2">
              {STATUS_FLOW.map(s => (
                <button
                  key={s}
                  onClick={() => toggleStatusFiltro(s)}
                  className={cn(
                    "glass-card px-3 py-2 flex items-center gap-2 transition-all hover:scale-[1.02]",
                    filters.status.includes(s) && 'ring-2 ring-primary'
                  )}
                >
                  <Badge variant="outline" className={cn("text-xs", STATUS_DOT[s])}>
                    {STATUS_LABELS[s]}
                  </Badge>
                  <span className="font-bold text-lg">{statusCounts[s]}</span>
                </button>
              ))}
            </div>

            <div className="glass-card p-3">
              <FiltersBar filters={filters} setFilters={setFilters} />
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Atendimentos ({atendimentosFiltrados.length})
                </h2>
                <Button variant="outline" size="sm" onClick={copiarTudoAgenda} className="gap-1 h-8 text-xs">
                  <Copy className="w-3 h-3" /> Copiar agendas filtradas
                </Button>
              </div>
              <AtendimentoList
                atendimentos={atendimentosFiltrados}
                onEdit={handleEdit}
                onDelete={remover}
                onStatusChange={handleStatusChange}
                onDuplicate={handleDuplicate}
                ocultarValores={ocultarValores}
              />
            </div>
          </TabsContent>

          <TabsContent value="calendario">
            <CalendarView
              atendimentos={atendimentos}
              onAtendimentoClick={handleEdit}
              filters={filters}
              setFilters={setFilters}
              ocultarValores={ocultarValores}
              onToggleOcultar={() => setOcultarValores(v => !v)}
            />
          </TabsContent>

          <TabsContent value="pendencias">
            <PendenciasView />
          </TabsContent>
        </Tabs>
        )}
      </main>

      <BackupManager open={backupOpen} onOpenChange={setBackupOpen} />
      <FeriadosManager open={feriadosOpen} onOpenChange={setFeriadosOpen} />

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
