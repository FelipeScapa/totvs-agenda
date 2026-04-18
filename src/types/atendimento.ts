export type TipoAtendimento = string;

export type StatusAtendimento = 'REGISTRADO' | 'AGUARDANDO_AGENDA' | 'EMAIL_ENVIADO' | 'AGENDA_CRIADA' | 'APONTADO';

export type StatusPrazo = 'OK' | 'ALERTA' | 'ATRASADO';

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
}

export const TIPO_LABELS: Record<TipoAtendimento, string> = {
  SUPORTE: 'Suporte',
  AJUSTE: 'Ajuste',
  REUNIAO: 'Reunião',
  INVESTIGACAO: 'Investigação',
};

export const STATUS_LABELS: Record<StatusAtendimento, string> = {
  REGISTRADO: 'Registrado',
  AGUARDANDO_AGENDA: 'Aguardando Agenda',
  EMAIL_ENVIADO: 'E-mail Enviado',
  AGENDA_CRIADA: 'Agenda Criada',
  APONTADO: 'Apontado',
};

export const STATUS_FLOW: StatusAtendimento[] = [
  'REGISTRADO',
  'AGUARDANDO_AGENDA',
  'EMAIL_ENVIADO',
  'AGENDA_CRIADA',
  'APONTADO',
];

export const VALOR_HORA = 26;
