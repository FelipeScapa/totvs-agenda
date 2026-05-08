import { useState, useEffect } from 'react';
import { Pendencia, usePendencias } from '@/hooks/use-pendencias';
import { useClientes } from '@/hooks/use-clientes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Plus, Trash2, Edit, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatarData } from '@/lib/atendimento-utils';

const STATUS_COLORS: Record<string, string> = {
  ABERTA: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  EM_ANDAMENTO: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  VALIDACAO: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  CONCLUIDA: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};
const STATUS_LABELS: Record<string, string> = {
  ABERTA: 'Aberta',
  EM_ANDAMENTO: 'Em andamento',
  VALIDACAO: 'Em validação',
  CONCLUIDA: 'Concluída',
};
const PRIO_COLORS: Record<string, string> = {
  BAIXA: 'bg-secondary/60 text-muted-foreground border-border',
  MEDIA: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  ALTA: 'bg-destructive/20 text-destructive border-destructive/30',
};

type OrdemKey = 'STATUS_PRIORIDADE' | 'PRIORIDADE' | 'STATUS' | 'PRAZO' | 'CRIACAO';

const PRIO_RANK = { ALTA: 0, MEDIA: 1, BAIXA: 2 };
const STATUS_RANK = { EM_ANDAMENTO: 0, ABERTA: 1, VALIDACAO: 2, CONCLUIDA: 3 };

export function PendenciasView() {
  const { pendencias, adicionar, atualizar, remover } = usePendencias();
  const { clientes } = useClientes();
  const [filtroCliente, setFiltroCliente] = useState<string>('TODOS');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [ordem, setOrdem] = useState<OrdemKey>('STATUS_PRIORIDADE');
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<Pendencia | null>(null);

  const filtradas = pendencias
    .filter(p => filtroCliente === 'TODOS' || p.cliente === filtroCliente)
    .filter(p => filtroStatus === 'TODOS' || p.status === filtroStatus)
    .sort((a, b) => {
      switch (ordem) {
        case 'PRIORIDADE':
          return PRIO_RANK[a.prioridade] - PRIO_RANK[b.prioridade];
        case 'STATUS':
          return STATUS_RANK[a.status] - STATUS_RANK[b.status];
        case 'PRAZO':
          return (a.prazo ?? '9999').localeCompare(b.prazo ?? '9999');
        case 'CRIACAO':
          return b.data_criacao.localeCompare(a.data_criacao);
        case 'STATUS_PRIORIDADE':
        default: {
          const s = STATUS_RANK[a.status] - STATUS_RANK[b.status];
          if (s !== 0) return s;
          return PRIO_RANK[a.prioridade] - PRIO_RANK[b.prioridade];
        }
      }
    });

  // agrupado por cliente
  const porCliente = filtradas.reduce<Record<string, Pendencia[]>>((acc, p) => {
    (acc[p.cliente] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={filtroCliente} onValueChange={setFiltroCliente}>
          <SelectTrigger className="w-48 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos os clientes</SelectItem>
            {clientes.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos os status</SelectItem>
            <SelectItem value="ABERTA">Aberta</SelectItem>
            <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
            <SelectItem value="CONCLUIDA">Concluída</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ordem} onValueChange={(v) => setOrdem(v as OrdemKey)}>
          <SelectTrigger className="w-52 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="STATUS_PRIORIDADE">Status + Prioridade</SelectItem>
            <SelectItem value="PRIORIDADE">Por prioridade</SelectItem>
            <SelectItem value="STATUS">Por status</SelectItem>
            <SelectItem value="PRAZO">Por prazo</SelectItem>
            <SelectItem value="CRIACAO">Mais recentes</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button size="sm" onClick={() => { setEditando(null); setOpen(true); }} className="gap-1">
            <Plus className="w-4 h-4" /> Nova pendência
          </Button>
        </div>
      </div>

      {Object.keys(porCliente).length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted-foreground">Nenhuma pendência cadastrada.</p>
        </div>
      ) : (
        Object.entries(porCliente).map(([clienteNome, items]) => (
          <div key={clienteNome} className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {clienteNome} <span className="text-xs">({items.length})</span>
            </h3>
            {items.map(p => (
              <div key={p.id} className="glass-card p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={cn("font-semibold", p.status === 'CONCLUIDA' && 'line-through text-muted-foreground')}>
                      {p.titulo}
                    </span>
                    <Badge variant="outline" className={STATUS_COLORS[p.status]}>{STATUS_LABELS[p.status]}</Badge>
                    <Badge variant="outline" className={PRIO_COLORS[p.prioridade]}>{p.prioridade}</Badge>
                    {p.prazo && (
                      <span className="text-xs text-muted-foreground">Prazo: {formatarData(p.prazo)}</span>
                    )}
                  </div>
                  {p.descricao && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.descricao}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <Select value={p.status} onValueChange={(v) => atualizar(p.id, { status: v as any })}>
                    <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ABERTA">Aberta</SelectItem>
                      <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
                      <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" onClick={() => { setEditando(p); setOpen(true); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remover(p.id)} className="hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      <PendenciaForm
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) setEditando(null); }}
        editando={editando}
        onSave={(p) => {
          if (editando) atualizar(editando.id, p);
          else adicionar(p);
        }}
      />
    </div>
  );
}

function PendenciaForm({
  open, onOpenChange, editando, onSave
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editando: Pendencia | null;
  onSave: (p: Omit<Pendencia, 'id' | 'data_criacao' | 'data_atualizacao'>) => void;
}) {
  const { clientes } = useClientes();
  const [cliente, setCliente] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<'BAIXA' | 'MEDIA' | 'ALTA'>('MEDIA');
  const [status, setStatus] = useState<'ABERTA' | 'EM_ANDAMENTO' | 'CONCLUIDA'>('ABERTA');
  const [prazo, setPrazo] = useState<Date | undefined>();

  useEffect(() => {
    if (!open) return;
    if (editando) {
      setCliente(editando.cliente);
      setTitulo(editando.titulo);
      setDescricao(editando.descricao);
      setPrioridade(editando.prioridade);
      setStatus(editando.status);
      setPrazo(editando.prazo ? new Date(editando.prazo + 'T00:00:00') : undefined);
    } else {
      setCliente(''); setTitulo(''); setDescricao('');
      setPrioridade('MEDIA'); setStatus('ABERTA'); setPrazo(undefined);
    }
  }, [open, editando]);

  const handleSave = () => {
    if (!cliente || !titulo.trim()) return;
    onSave({
      cliente,
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      prioridade,
      status,
      prazo: prazo ? format(prazo, 'yyyy-MM-dd') : undefined,
    });
    onOpenChange(false);
    setCliente(''); setTitulo(''); setDescricao(''); setPrioridade('MEDIA'); setStatus('ABERTA'); setPrazo(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar' : 'Nova'} Pendência</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Cliente *</Label>
            <Select value={cliente} onValueChange={setCliente}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {clientes.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Título *</Label>
            <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="O que precisa ser feito" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prioridade</Label>
              <Select value={prioridade} onValueChange={(v) => setPrioridade(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAIXA">Baixa</SelectItem>
                  <SelectItem value="MEDIA">Média</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ABERTA">Aberta</SelectItem>
                  <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
                  <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Prazo</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !prazo && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {prazo ? format(prazo, "dd/MM/yyyy", { locale: ptBR }) : 'Sem prazo'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={prazo} onSelect={setPrazo} locale={ptBR} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={handleSave} className="w-full">Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
