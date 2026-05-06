import { useMemo } from 'react';
import { Atendimento } from '@/types/atendimento';
import { calcularValor, calcularStatusPrazo } from '@/lib/atendimento-utils';
import { useServicos } from '@/hooks/use-servicos';
import { useFeriados } from '@/hooks/use-feriados';
import { Clock, DollarSign, AlertTriangle, FileText, Timer, Eye, EyeOff, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardCardsProps {
  atendimentos: Atendimento[];
  ocultarValores: boolean;
  onToggleOcultar: () => void;
}

export function DashboardCards({ atendimentos, ocultarValores, onToggleOcultar }: DashboardCardsProps) {
  const { servicos } = useServicos();
  const { isDiaNaoComputado } = useFeriados();

  const getValorHora = (a: Atendimento) => {
    if (a.servico_id) {
      const s = servicos.find(s => s.id === a.servico_id);
      if (s) return s.valor_hora;
    }
    return 26;
  };

  const stats = useMemo(() => {
    const pendentes = atendimentos.filter(a => a.status !== 'APONTADO');
    const atrasados = pendentes.filter(a => calcularStatusPrazo(a.data) === 'ATRASADO');
    const computaveis = atendimentos.filter(a => !isDiaNaoComputado(a.data));
    const totalHoras = computaveis.reduce((s, a) => s + a.duracao_horas, 0);
    const valorTotal = computaveis.reduce((s, a) => s + calcularValor(a.duracao_horas, getValorHora(a)), 0);
    const naoComputados = atendimentos.length - computaveis.length;

    return {
      total: atendimentos.length,
      totalHoras, valorTotal,
      pendentes: pendentes.length,
      atrasados: atrasados.length,
      naoComputados,
    };
  }, [atendimentos, servicos, isDiaNaoComputado]);

  const ocultar = (valor: string) => !ocultarValores ? valor : '••••••';

  const cards = [
    { label: 'Atendimentos', value: String(stats.total), sub: 'no período filtrado', icon: FileText, color: 'text-foreground' },
    { label: 'Horas totais', value: stats.totalHoras.toFixed(1), sub: 'horas computadas', icon: Clock, color: 'text-primary' },
    { label: 'Valor total', value: ocultar(`R$ ${stats.valorTotal.toFixed(2)}`), sub: ocultar(`${stats.totalHoras.toFixed(1)}h`), icon: DollarSign, color: 'text-primary' },
    { label: 'Pendentes', value: String(stats.pendentes), sub: 'sem apontamento', icon: Timer, color: 'text-muted-foreground' },
    { label: 'Atrasados', value: String(stats.atrasados), sub: '5+ dias', icon: AlertTriangle, color: 'text-destructive' },
    { label: 'Não computados', value: String(stats.naoComputados), sub: 'férias/feriados', icon: Plane, color: 'text-cyan-400' },
  ];

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={onToggleOcultar} className="gap-1 text-xs text-muted-foreground">
          {!ocultarValores ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          {!ocultarValores ? 'Ocultar valores' : 'Mostrar valores'}
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(card => (
          <div key={card.label} className="glass-card p-4 space-y-2">
            <div className="flex items-center gap-2">
              <card.icon className={`w-4 h-4 ${card.color}`} />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{card.label}</span>
            </div>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
