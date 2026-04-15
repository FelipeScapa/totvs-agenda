import { useMemo } from 'react';
import { Atendimento } from '@/types/atendimento';
import { calcularValor, calcularStatusPrazo } from '@/lib/atendimento-utils';
import { Clock, DollarSign, AlertTriangle, CheckCircle, FileText, Timer } from 'lucide-react';

interface DashboardCardsProps {
  atendimentos: Atendimento[];
}

export function DashboardCards({ atendimentos }: DashboardCardsProps) {
  const stats = useMemo(() => {
    const hoje = new Date().toISOString().split('T')[0];
    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
    const semanaStr = inicioSemana.toISOString().split('T')[0];

    const diaAtual = atendimentos.filter(a => a.data === hoje);
    const semanaAtual = atendimentos.filter(a => a.data >= semanaStr);
    const pendentes = atendimentos.filter(a => a.status !== 'APONTADO');
    const alertas = pendentes.filter(a => calcularStatusPrazo(a.data) === 'ALERTA');
    const atrasados = pendentes.filter(a => calcularStatusPrazo(a.data) === 'ATRASADO');
    const totalHoras = atendimentos.reduce((s, a) => s + a.duracao_horas, 0);

    return {
      totalDia: diaAtual.length,
      totalSemana: semanaAtual.length,
      totalHoras,
      valorTotal: calcularValor(totalHoras),
      pendentes: pendentes.length,
      alertas: alertas.length,
      atrasados: atrasados.length,
    };
  }, [atendimentos]);

  const cards = [
    { label: 'Hoje', value: stats.totalDia, sub: `${stats.totalSemana} na semana`, icon: FileText, color: 'text-foreground' },
    { label: 'Horas totais', value: stats.totalHoras.toFixed(1), sub: 'horas registradas', icon: Clock, color: 'text-primary' },
    { label: 'Valor total', value: `R$ ${stats.valorTotal.toFixed(2)}`, sub: `${stats.totalHoras.toFixed(1)}h × R$26`, icon: DollarSign, color: 'text-primary' },
    { label: 'Pendentes', value: stats.pendentes, sub: 'sem apontamento', icon: Timer, color: 'text-muted-foreground' },
    { label: 'Em alerta', value: stats.alertas, sub: '4 dias', icon: AlertTriangle, color: 'text-warning' },
    { label: 'Atrasados', value: stats.atrasados, sub: '5+ dias', icon: AlertTriangle, color: 'text-destructive' },
  ];

  return (
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
  );
}
