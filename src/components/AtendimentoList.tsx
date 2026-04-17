import { Atendimento, STATUS_LABELS, STATUS_FLOW } from '@/types/atendimento';
import { diasRestantesPrazo, textoPrazo, calcularValor, formatarData, gerarTextoOS, gerarTextoAgenda, conflitaAgenda } from '@/lib/atendimento-utils';
import { useTiposAtendimento } from '@/hooks/use-tipos-atendimento';
import { useServicos } from '@/hooks/use-servicos';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Trash2, Copy, FileText, CalendarDays, CopyPlus, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const STATUS_COLORS: Record<string, string> = {
  REGISTRADO: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  AGUARDANDO_AGENDA: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  EMAIL_ENVIADO: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  AGENDA_CRIADA: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  APONTADO: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

interface AtendimentoListProps {
  atendimentos: Atendimento[];
  onEdit: (a: Atendimento) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Atendimento['status']) => void;
  onDuplicate: (a: Atendimento) => void;
  ocultarValores?: boolean;
}

export function AtendimentoList({ atendimentos, onEdit, onDelete, onStatusChange, onDuplicate, ocultarValores }: AtendimentoListProps) {
  const { toast } = useToast();
  const { tipos } = useTiposAtendimento();
  const { servicos } = useServicos();

  const tipoLabel = (id: string) => tipos.find(t => t.id === id)?.label ?? id;

  const getValorHora = (a: Atendimento) => {
    if (a.servico_id) {
      const s = servicos.find(s => s.id === a.servico_id);
      if (s) return s.valor_hora;
    }
    return 26;
  };

  const copiar = (texto: string, label: string) => {
    navigator.clipboard.writeText(texto);
    toast({ title: 'Copiado!', description: `${label} copiado para a área de transferência.` });
  };

  const prazoBadgeColor = (dias: number) => {
    if (dias < 0) return 'bg-destructive/20 text-destructive border-destructive/30';
    if (dias <= 1) return 'bg-warning/20 text-warning border-warning/30';
    if (dias <= 3) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-success/20 text-success border-success/30';
  };

  if (atendimentos.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-muted-foreground">Nenhum atendimento registrado.</p>
        <p className="text-sm text-muted-foreground mt-1">Use o modo rápido ou crie um novo atendimento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {atendimentos.map(a => {
        const dias = diasRestantesPrazo(a.data);
        const valorHora = getValorHora(a);
        const servico = a.servico_id ? servicos.find(s => s.id === a.servico_id) : null;
        const statusColor = STATUS_COLORS[a.status] || '';
        const conflito = atendimentos.some(b => conflitaAgenda(a, b));

        return (
          <div key={a.id} className="glass-card p-4 flex items-center gap-4 group hover:border-primary/30 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-semibold truncate">{a.cliente}</span>
                <Badge variant="outline" className={statusColor}>
                  {STATUS_LABELS[a.status] || a.status}
                </Badge>
                <Select
                  value={a.status}
                  onValueChange={(v) => onStatusChange(a.id, v as Atendimento['status'])}
                >
                  <SelectTrigger className="h-6 text-xs w-auto min-w-[100px] border-border/50 bg-secondary/50">
                    <SelectValue placeholder="Alterar" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FLOW.map(s => (
                      <SelectItem key={s} value={s}>
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[s]?.split(' ')[0] || ''}`} />
                          {STATUS_LABELS[s]}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {a.status !== 'APONTADO' && (
                  <Badge variant="outline" className={prazoBadgeColor(dias)}>{textoPrazo(a.data)}</Badge>
                )}
                {conflito && (
                  <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30 gap-1">
                    <AlertCircle className="w-3 h-3" /> Conflito de horário
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                <span>{formatarData(a.data)}</span>
                <span>{a.hora_inicio}–{a.hora_fim}</span>
                <span className="font-mono">{a.duracao_horas}h</span>
                <span className="font-mono">
                  {ocultarValores ? '••••••' : `R$${calcularValor(a.duracao_horas, valorHora).toFixed(2)}`}
                </span>
                <span>{tipoLabel(a.tipo)}</span>
                {servico && <span className="text-xs bg-secondary/50 px-1.5 py-0.5 rounded">{servico.nome}</span>}
              </div>
              {a.descricao && <p className="text-sm text-muted-foreground mt-1 truncate">{a.descricao}</p>}
            </div>

            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" title="Copiar">
                    <Copy className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => copiar(gerarTextoOS(a), 'Texto da OS')}>
                    <FileText className="w-4 h-4 mr-2" /> Copiar OS
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => copiar(gerarTextoAgenda(a), 'Texto da Agenda')}>
                    <CalendarDays className="w-4 h-4 mr-2" /> Copiar Agenda
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="sm" onClick={() => onDuplicate(a)} title="Duplicar">
                <CopyPlus className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onEdit(a)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(a.id)} className="hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
