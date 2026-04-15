import { useState, useMemo } from 'react';
import { useAtendimentos } from '@/hooks/use-atendimentos';
import { DashboardCards } from '@/components/DashboardCards';
import { QuickMode } from '@/components/QuickMode';
import { AtendimentoList } from '@/components/AtendimentoList';
import { AtendimentoForm } from '@/components/AtendimentoForm';
import { ClienteManager } from '@/components/ClienteManager';
import { TipoManager } from '@/components/TipoManager';
import { Atendimento } from '@/types/atendimento';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Activity, Users, Tag, X } from 'lucide-react';

const Index = () => {
  const { atendimentos, adicionar, atualizar, remover } = useAtendimentos();
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Atendimento | null>(null);
  const [clienteOpen, setClienteOpen] = useState(false);
  const [tipoOpen, setTipoOpen] = useState(false);
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  const atendimentosFiltrados = useMemo(() => {
    return atendimentos.filter(a => {
      if (filtroDataInicio && a.data < filtroDataInicio) return false;
      if (filtroDataFim && a.data > filtroDataFim) return false;
      return true;
    });
  }, [atendimentos, filtroDataInicio, filtroDataFim]);

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
            <Button size="sm" onClick={() => { setEditando(null); setFormOpen(true); }} className="gap-1">
              <Plus className="w-4 h-4" /> Novo
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <QuickMode onSave={adicionar} />
        <DashboardCards atendimentos={atendimentos} />
        <div>
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Atendimentos ({atendimentosFiltrados.length})
            </h2>
            <div className="flex items-center gap-2 ml-auto">
              <Input
                type="date"
                value={filtroDataInicio}
                onChange={e => setFiltroDataInicio(e.target.value)}
                className="w-36 h-8 text-xs"
                placeholder="Data início"
              />
              <span className="text-muted-foreground text-xs">até</span>
              <Input
                type="date"
                value={filtroDataFim}
                onChange={e => setFiltroDataFim(e.target.value)}
                className="w-36 h-8 text-xs"
                placeholder="Data fim"
              />
              {(filtroDataInicio || filtroDataFim) && (
                <Button variant="ghost" size="sm" onClick={() => { setFiltroDataInicio(''); setFiltroDataFim(''); }} className="h-8 px-2">
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
    </div>
  );
};

export default Index;
