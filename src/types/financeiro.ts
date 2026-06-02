export type FinTipoMov = 'RECEITA' | 'DESPESA';
export type FinTipoGasto = string;

export interface FinInstituicao {
  id: string;
  nome: string;
  cor?: string;
}

export interface FinConta {
  id: string;
  nome: string;
  instituicao_id?: string;
  saldo_inicial: number;
  vr: boolean;
  somar_no_total: boolean;
  arquivada?: boolean;
  data_criacao: string;
}

export interface FinCategoria {
  id: string;
  nome: string;
  movimento: FinTipoMov;
  parent_id?: string;
  tipo_id?: string;
  somar_nos_ganhos?: boolean;
  cor?: string;
  sistema?: boolean; // categorias automáticas (ex.: Devedor)
}

export interface FinTipo {
  id: string;
  nome: string;
  cor?: string;
}

export interface FinDivisao {
  porcentagens: Record<string, number>;
  modo?: 'percentual' | 'valor';
  fonte?: 'previsto' | 'recebido'; // base de receita para o cálculo
}

export interface FinLimite {
  id: string;
  categoria_id: string;
  mes: string;
  valor: number;
}

export interface FinTransacao {
  id: string;
  data: string;
  descricao: string;
  movimento: FinTipoMov;
  categoria_id: string;
  tipo_id?: string;
  conta_id: string;
  valor: number;
  pago: boolean;
  observacao?: string;
  fixa?: boolean;
  pessoas?: FinFinanciamentoPessoa[];
  pessoas_quitadas?: string[];
  financiamento_id?: string;
  parcela?: number;
  ajuste?: boolean;
  data_criacao: string;
}

export interface FinFinanciamentoPessoa {
  nome: string;
  porcentagem?: number;
  valor?: number;
}

export interface FinFinanciamento {
  id: string;
  descricao: string;
  conta_id: string;
  categoria_id: string;
  tipo_id?: string;
  valor_parcela: number;
  total_parcelas: number;
  parcela_atual: number;
  mes_referencia: string;
  dia_vencimento: number;
  pessoas?: FinFinanciamentoPessoa[];
  data_criacao: string;
}

export type FinDividaTipo = 'AVISTA' | 'PARCELADA';

export interface FinDivida {
  id: string;
  descricao: string;
  credor: string;
  tipo: FinDividaTipo;
  valor_total: number;          // total bruto
  valor_pago: number;
  valor_avista?: number;        // condição para quitação à vista
  valor_parcela?: number;       // se parcelada
  total_parcelas?: number;      // se parcelada
  observacao?: string;
  data_criacao: string;
}

export const FIN_TIPOS_PADRAO: FinTipo[] = [
  { id: 'essencial', nome: 'Essencial', cor: '#ef4444' },
  { id: 'qualidade', nome: 'Qualidade', cor: '#f59e0b' },
  { id: 'investimento', nome: 'Investimento', cor: '#22c55e' },
  { id: 'outros', nome: 'Outros', cor: '#64748b' },
];

export const CATEGORIA_DEVEDOR_ID = 'devedor';
