import { Atendimento, StatusPrazo, VALOR_HORA } from '@/types/atendimento';

export function calcularDuracao(horaInicio: string, horaFim: string): number {
  const [hi, mi] = horaInicio.split(':').map(Number);
  const [hf, mf] = horaFim.split(':').map(Number);
  const diff = (hf * 60 + mf) - (hi * 60 + mi);
  return Math.max(0, parseFloat((diff / 60).toFixed(2)));
}

export function calcularValor(duracaoHoras: number, valorHora?: number): number {
  return duracaoHoras * (valorHora ?? VALOR_HORA);
}

export function calcularStatusPrazo(dataAtendimento: string): StatusPrazo {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const data = new Date(dataAtendimento + 'T00:00:00');
  const diffMs = hoje.getTime() - data.getTime();
  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (dias >= 5) return 'ATRASADO';
  if (dias === 4) return 'ALERTA';
  return 'OK';
}

export function gerarTextoOS(a: Atendimento): string {
  return `Cliente: ${a.cliente}

Atividade: ${a.tipo}

Descrição:
${a.descricao}

Detalhes:
${a.observacoes || '(sem observações)'}

Tempo total: ${a.duracao_horas} horas`;
}

export function gerarTextoAgenda(a: Atendimento): string {
  const dataFormatada = formatarData(a.data);
  return `${dataFormatada} - ${a.hora_inicio} às ${a.hora_fim} (${a.duracao_horas}h)
Cliente: ${a.cliente}`;
}

export function diasRestantesPrazo(dataAtendimento: string): number {
  // positivo = ainda faltam X dias; 0 = hoje é o último; negativo = atrasado em |X| dias
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const data = new Date(dataAtendimento + 'T00:00:00');
  const diffMs = hoje.getTime() - data.getTime();
  const diasPassados = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  // regra: prazo é 5 dias após a data
  return 5 - diasPassados;
}

export function textoPrazo(dataAtendimento: string): string {
  const d = diasRestantesPrazo(dataAtendimento);
  if (d > 1) return `Faltam ${d} dias`;
  if (d === 1) return 'Falta 1 dia';
  if (d === 0) return 'Vence hoje';
  if (d === -1) return 'Atrasado 1 dia';
  return `Atrasado ${Math.abs(d)} dias`;
}

export function conflitaAgenda(a: Atendimento, b: Atendimento): boolean {
  if (a.id === b.id || a.data !== b.data) return false;
  // intervalos ranges para subtrair (são pausas, não bloqueiam)
  const rangesA = effectiveRanges(a);
  const rangesB = effectiveRanges(b);
  for (const ra of rangesA) {
    for (const rb of rangesB) {
      if (ra.start < rb.end && rb.start < ra.end) return true;
    }
  }
  return false;
}

function effectiveRanges(a: Atendimento): { start: string; end: string }[] {
  if (a.intervalo_inicio && a.intervalo_fim &&
      a.intervalo_inicio >= a.hora_inicio && a.intervalo_fim <= a.hora_fim &&
      a.intervalo_inicio < a.intervalo_fim) {
    return [
      { start: a.hora_inicio, end: a.intervalo_inicio },
      { start: a.intervalo_fim, end: a.hora_fim },
    ];
  }
  return [{ start: a.hora_inicio, end: a.hora_fim }];
}

export function formatarHora(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function formatarData(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
