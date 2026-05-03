export type FinTipoMov = 'RECEITA' | 'DESPESA';
export type FinTipoGasto = string; // id de FinTipo (Essencial, Qualidade, Investimento, Outros…)

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
  vr: boolean;             // se é conta tipo VR
  somar_no_total: boolean; // se entra no card "Valor Atual"
  arquivada?: boolean;
  data_criacao: string;
}

export interface FinCategoria {
  id: string;
  nome: string;
  movimento: FinTipoMov;
  parent_id?: string;             // subcategoria
  somar_nos_ganhos?: boolean;     // só para RECEITA
  cor?: string;
}

export interface FinTipo {
  id: string;
  nome: string;       // Essencial, Qualidade, Investimento…
  cor?: string;
}

export interface FinDivisao {
  // Distribuição percentual dos ganhos por tipo (soma 100)
  // map tipo_id -> percentual
  porcentagens: Record<string, number>;
}

export interface FinLimite {
  id: string;
  categoria_id: string;
  mes: string;          // 'YYYY-MM'
  valor: number;
}

export interface FinTransacao {
  id: string;
  data: string;             // YYYY-MM-DD
  descricao: string;
  movimento: FinTipoMov;
  categoria_id: string;
  tipo_id?: string;         // só faz sentido para DESPESA
  conta_id: string;
  valor: number;
  pago: boolean;
  observacao?: string;
  // referências
  financiamento_id?: string;
  parcela?: number;
  ajuste?: boolean;         // ajuste de saldo
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
  parcela_atual: number;          // parcela referente ao mês de referência
  mes_referencia: string;         // 'YYYY-MM' do mês em que está a parcela_atual
  dia_vencimento: number;         // 1..31
  pessoas?: FinFinanciamentoPessoa[];
  data_criacao: string;
}

export interface FinDivida {
  id: string;
  descricao: string;
  credor: string;
  valor_total: number;
  valor_pago: number;
  observacao?: string;
  data_criacao: string;
}

export const FIN_TIPOS_PADRAO: FinTipo[] = [
  { id: 'essencial', nome: 'Essencial', cor: '#ef4444' },
  { id: 'qualidade', nome: 'Qualidade', cor: '#f59e0b' },
  { id: 'investimento', nome: 'Investimento', cor: '#22c55e' },
  { id: 'outros', nome: 'Outros', cor: '#64748b' },
];
