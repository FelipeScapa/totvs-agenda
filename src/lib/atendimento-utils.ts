import { Atendimento, StatusPrazo, VALOR_HORA } from '@/types/atendimento';

export function calcularDuracao(horaInicio: string, horaFim: string): number {
  const [hi, mi] = horaInicio.split(':').map(Number);
  const [hf, mf] = horaFim.split(':').map(Number);
  const diff = (hf * 60 + mf) - (hi * 60 + mi);
  return Math.max(0, parseFloat((diff / 60).toFixed(2)));
}

export function calcularValor(duracaoHoras: number): number {
  return duracaoHoras * VALOR_HORA;
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

export function formatarHora(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function formatarData(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
