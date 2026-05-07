import { useMemo } from 'react';
import { Atendimento } from '@/types/atendimento';
import { calcularValor, calcularStatusPrazo } from '@/lib/atendimento-utils';
import { useServicos } from '@/hooks/use-servicos';
import { useFeriados } from '@/hooks/use-feriados';
import { Clock, DollarSign, AlertTriangle, FileText, Timer, Eye, EyeOff, Plane, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardCardsProps {
  atendimentos: Atendimento[];
  ocultarValores: boolean;
  onToggleOcultar: () => void;
  periodo?: { inicio?: string; fim?: string };
}

const HORAS_DIA_UTIL = 8;

function calcularPrevisao(
  inicio: string | undefined,
  fim: string | undefined,
  isDiaForaPrevisao: (d: string) => boolean,
  valorHoraDefault: number
) {
  if (!inicio || !fim) return null;
  const start = new Date(inicio + 'T00:00:00');
  const end = new Date(fim + 'T00:00:00');
  if (start > end) return null;
  let dias = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getDay(); // 0=dom, 6=sab
    const iso = cur.toISOString().slice(0, 10);
    if (dow >= 1 && dow <= 5 && !isDiaForaPrevisao(iso)) dias++;
    cur.setDate(cur.getDate() + 1);
  }
  const horas = dias * HORAS_DIA_UTIL;
  return { dias, horas, valor: horas * valorHoraDefault };
}

export function DashboardCards({ atendimentos, ocultarValores, onToggleOcultar, periodo }: DashboardCardsProps) {
  const { servicos } = useServicos();
  const { isDiaNaoComputado, isDiaForaPrevisao } = useFeriados();

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
    const totalHoras = a.duracao_horas;
    const valorTotal = calcularValor(a.duracao_horas, getValorHora(a));
    const naoComputados = 0//atendimentos.length - computaveis.length;

    return {
      total: atendimentos.length,
      totalHoras, valorTotal,
      pendentes: pendentes.length,
      atrasados: atrasados.length,
      //naoComputados,
    };
  }, [atendimentos, servicos, isDiaNaoComputado]);

  const previsao = useMemo(
    () => calcularPrevisao(periodo?.inicio, periodo?.fim, (d) => isDiaForaPrevisao(d), 26),
    [periodo?.inicio, periodo?.fim, isDiaForaPrevisao]
  );

  const ocultar = (valor: string) => !ocultarValores ? valor : '••••••';

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={onToggleOcultar} className="gap-1 text-xs text-muted-foreground">
          {!ocultarValores ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          {!ocultarValores ? 'Ocultar valores' : 'Mostrar valores'}
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card icon={FileText} label="Atendimentos" value={String(stats.total)} sub="no período filtrado" />

        {/* Card mesclado: Horas + Valor */}
        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Horas / Valor</span>
          </div>
          <p className="text-2xl font-bold text-primary">{stats.totalHoras.toFixed(1)}<span className="text-sm text-muted-foreground ml-1">h</span></p>
          <p className="text-base font-semibold text-primary/80">{ocultar(`R$ ${stats.valorTotal.toFixed(2)}`)}</p>
        </div>

        <Card icon={Timer} label="Pendentes" value={String(stats.pendentes)} sub="sem apontamento" color="text-muted-foreground" />
        <Card icon={AlertTriangle} label="Atrasados" value={String(stats.atrasados)} sub="5+ dias" color="text-destructive" />

        {/* Previsão */}
        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Previsão</span>
          </div>
          {previsao ? (
            <>
              <p className="text-2xl font-bold text-emerald-400">{previsao.horas}<span className="text-sm text-muted-foreground ml-1">h</span></p>
              <p className="text-base font-semibold text-emerald-400/80">{ocultar(`R$ ${previsao.valor.toFixed(2)}`)}</p>
              <p className="text-[10px] text-muted-foreground">{previsao.dias} dias úteis × {HORAS_DIA_UTIL}h</p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground pt-2">Defina um período para ver a previsão</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ icon: Icon, label, value, sub, color = 'text-foreground' }: { icon: any; label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="glass-card p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
