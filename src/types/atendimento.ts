export type TipoAtendimento = string;

export type StatusAtendimento = 'REGISTRADO' | 'EMAIL_ENVIADO' | 'AGENDA_CRIADA' | 'APONTADO';

export type StatusPrazo = 'OK' | 'ALERTA' | 'ATRASADO';

export type Modalidade = 'REMOTA' | 'PRESENCIAL';

export const MODALIDADE_LABELS: Record<Modalidade, string> = {
  REMOTA: 'Remota',
  PRESENCIAL: 'Presencial',
};

export interface Atendimento {
  id: string;
  cliente: string;
  descricao: string;
  tipo: TipoAtendimento;
  servico_id?: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  duracao_horas: number;
  status: StatusAtendimento;
  observacoes: string;
  data_criacao: string;
  data_atualizacao: string;
  intervalo_inicio?: string;
  intervalo_fim?: string;
  // Modalidade / traslado / alimentação
  modalidade?: Modalidade;
  tem_traslado?: boolean;
  traslado_origem?: string;
  traslado_destino?: string;
  traslado_saida?: string | null;
  traslado_retorno?: string | null;
  traslado_km?: number;
  traslado_valor?: number;
  traslado_obs?: string;
  valor_cafe?: number;
  valor_almoco?: number;
  valor_jantar?: number;
}

export function totalAlimentacao(a: Pick<Atendimento, 'valor_cafe' | 'valor_almoco' | 'valor_jantar'>): number {
  return (a.valor_cafe ?? 0) + (a.valor_almoco ?? 0) + (a.valor_jantar ?? 0);
}

export const TIPO_LABELS: Record<TipoAtendimento, string> = {
  SUPORTE: 'Suporte',
  AJUSTE: 'Ajuste',
  REUNIAO: 'Reunião',
  INVESTIGACAO: 'Investigação',
};

export const STATUS_LABELS: Record<StatusAtendimento, string> = {
  REGISTRADO: 'Registrado',
  EMAIL_ENVIADO: 'E-mail Enviado',
  AGENDA_CRIADA: 'Agenda Criada',
  APONTADO: 'Apontado',
};

export const STATUS_FLOW: StatusAtendimento[] = [
  'REGISTRADO',
  'EMAIL_ENVIADO',
  'AGENDA_CRIADA',
  'APONTADO',
];

export const VALOR_HORA = 26;
