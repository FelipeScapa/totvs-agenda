import { useState } from 'react';
import { Atendimento, STATUS_LABELS, STATUS_FLOW, TIPO_LABELS } from '@/types/atendimento';
import { calcularStatusPrazo, calcularValor, formatarData, gerarTextoOS } from '@/lib/atendimento-utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Copy, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AtendimentoListProps {
  atendimentos: Atendimento[];
  onEdit: (a: Atendimento) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Atendimento['status']) => void;
}

export function AtendimentoList({ atendimentos, onEdit, onDelete, onStatusChange }: AtendimentoListProps) {
  const { toast } = useToast();

  const copiarOS = (a: Atendimento) => {
    navigator.clipboard.writeText(gerarTextoOS(a));
    toast({ title: 'Texto copiado!', description: 'Texto da OS copiado para a área de transferência.' });
  };

  const nextStatus = (current: Atendimento['status']) => {
    const idx = STATUS_FLOW.indexOf(current);
    return idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
  };

  const prazoColor = (prazo: string) => {
    if (prazo === 'ATRASADO') return 'bg-destructive/20 text-destructive border-destructive/30';
    if (prazo === 'ALERTA') return 'bg-warning/20 text-warning border-warning/30';
    return 'bg-success/20 text-success border-success/30';
  };

  const statusColor = (status: string) => {
    if (status === 'APONTADO') return 'bg-success/20 text-success border-success/30';
    return 'bg-secondary text-secondary-foreground border-border';
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
        const prazo = a.status !== 'APONTADO' ? calcularStatusPrazo(a.data) : 'OK';
        const next = nextStatus(a.status);

        return (
          <div key={a.id} className="glass-card p-4 flex items-center gap-4 group hover:border-primary/30 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold truncate">{a.cliente}</span>
                <Badge variant="outline" className={statusColor(a.status)}>{STATUS_LABELS[a.status]}</Badge>
                {a.status !== 'APONTADO' && (
                  <Badge variant="outline" className={prazoColor(prazo)}>{prazo}</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{formatarData(a.data)}</span>
                <span>{a.hora_inicio}–{a.hora_fim}</span>
                <span className="font-mono">{a.duracao_horas}h</span>
                <span className="font-mono">R${calcularValor(a.duracao_horas).toFixed(2)}</span>
                <span>{TIPO_LABELS[a.tipo]}</span>
              </div>
              {a.descricao && <p className="text-sm text-muted-foreground mt-1 truncate">{a.descricao}</p>}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {next && (
                <Button variant="ghost" size="sm" onClick={() => onStatusChange(a.id, next)} title={`Avançar para ${STATUS_LABELS[next]}`}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => copiarOS(a)} title="Gerar texto OS">
                <Copy className="w-4 h-4" />
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
