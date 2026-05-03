import { useStored } from '@/lib/storage-store';
import {
  FinConta, FinCategoria, FinTipo, FinTransacao, FinInstituicao,
  FinLimite, FinDivisao, FinFinanciamento, FinDivida, FIN_TIPOS_PADRAO,
} from '@/types/financeiro';

const K = {
  contas: 'fin-contas',
  categorias: 'fin-categorias',
  tipos: 'fin-tipos',
  transacoes: 'fin-transacoes',
  instituicoes: 'fin-instituicoes',
  limites: 'fin-limites',
  divisao: 'fin-divisao',
  financiamentos: 'fin-financiamentos',
  dividas: 'fin-dividas',
};

const INSTITUICOES_PADRAO: FinInstituicao[] = [
  { id: 'nubank', nome: 'Nubank', cor: '#8a05be' },
  { id: 'c6', nome: 'C6 Bank', cor: '#1a1a1a' },
  { id: 'bradesco', nome: 'Bradesco', cor: '#cc092f' },
  { id: 'itau', nome: 'Itaú', cor: '#ec7000' },
  { id: 'inter', nome: 'Inter', cor: '#ff7a00' },
  { id: 'caixa', nome: 'Caixa', cor: '#0070af' },
  { id: 'swile', nome: 'Swile', cor: '#ff5e3a' },
  { id: 'alelo', nome: 'Alelo', cor: '#e30613' },
  { id: 'vr', nome: 'VR', cor: '#005ca9' },
  { id: 'ticket', nome: 'Ticket', cor: '#005bbb' },
];

const CATEGORIAS_PADRAO: FinCategoria[] = [
  { id: 'salario', nome: 'Salário', movimento: 'RECEITA', somar_nos_ganhos: true },
  { id: 'freela', nome: 'Freelance', movimento: 'RECEITA', somar_nos_ganhos: true },
  { id: 'mercado', nome: 'Mercado', movimento: 'DESPESA' },
  { id: 'aluguel', nome: 'Aluguel', movimento: 'DESPESA' },
  { id: 'transporte', nome: 'Transporte', movimento: 'DESPESA' },
  { id: 'lazer', nome: 'Lazer', movimento: 'DESPESA' },
  { id: 'investimentos', nome: 'Investimentos', movimento: 'DESPESA' },
];

function uuid() { return crypto.randomUUID(); }

export function useFinContas() {
  const [list, setList] = useStored<FinConta[]>(K.contas, []);
  return {
    contas: list,
    add: (c: Omit<FinConta, 'id' | 'data_criacao'>) =>
      setList([{ ...c, id: uuid(), data_criacao: new Date().toISOString() }, ...list]),
    update: (id: string, patch: Partial<FinConta>) =>
      setList(list.map(i => i.id === id ? { ...i, ...patch } : i)),
    remove: (id: string) => setList(list.filter(i => i.id !== id)),
  };
}

export function useFinInstituicoes() {
  const [list, setList] = useStored<FinInstituicao[]>(K.instituicoes, INSTITUICOES_PADRAO);
  return {
    instituicoes: list,
    add: (nome: string, cor?: string) => setList([{ id: uuid(), nome, cor }, ...list]),
    remove: (id: string) => setList(list.filter(i => i.id !== id)),
  };
}

export function useFinCategorias() {
  const [list, setList] = useStored<FinCategoria[]>(K.categorias, CATEGORIAS_PADRAO);
  return {
    categorias: list,
    add: (c: Omit<FinCategoria, 'id'>) => setList([{ ...c, id: uuid() }, ...list]),
    update: (id: string, patch: Partial<FinCategoria>) =>
      setList(list.map(i => i.id === id ? { ...i, ...patch } : i)),
    remove: (id: string) => setList(list.filter(i => i.id !== id)),
  };
}

export function useFinTipos() {
  const [list, setList] = useStored<FinTipo[]>(K.tipos, FIN_TIPOS_PADRAO);
  return {
    tipos: list,
    add: (nome: string, cor?: string) => setList([{ id: uuid(), nome, cor }, ...list]),
    update: (id: string, patch: Partial<FinTipo>) =>
      setList(list.map(i => i.id === id ? { ...i, ...patch } : i)),
    remove: (id: string) => setList(list.filter(i => i.id !== id)),
  };
}

export function useFinTransacoes() {
  const [list, setList] = useStored<FinTransacao[]>(K.transacoes, []);
  return {
    transacoes: list,
    add: (t: Omit<FinTransacao, 'id' | 'data_criacao'>) =>
      setList([{ ...t, id: uuid(), data_criacao: new Date().toISOString() }, ...list]),
    update: (id: string, patch: Partial<FinTransacao>) =>
      setList(list.map(i => i.id === id ? { ...i, ...patch } : i)),
    remove: (id: string) => setList(list.filter(i => i.id !== id)),
  };
}

export function useFinLimites() {
  const [list, setList] = useStored<FinLimite[]>(K.limites, []);
  return {
    limites: list,
    set: (categoria_id: string, mes: string, valor: number) => {
      const existing = list.find(l => l.categoria_id === categoria_id && l.mes === mes);
      if (existing) setList(list.map(l => l.id === existing.id ? { ...l, valor } : l));
      else setList([{ id: uuid(), categoria_id, mes, valor }, ...list]);
    },
    remove: (id: string) => setList(list.filter(i => i.id !== id)),
  };
}

export function useFinDivisao() {
  const [div, setDiv] = useStored<FinDivisao>(K.divisao, {
    porcentagens: { essencial: 60, qualidade: 15, investimento: 25 },
  });
  return { divisao: div, set: setDiv };
}

export function useFinFinanciamentos() {
  const [list, setList] = useStored<FinFinanciamento[]>(K.financiamentos, []);
  return {
    financiamentos: list,
    add: (f: Omit<FinFinanciamento, 'id' | 'data_criacao'>) =>
      setList([{ ...f, id: uuid(), data_criacao: new Date().toISOString() }, ...list]),
    update: (id: string, patch: Partial<FinFinanciamento>) =>
      setList(list.map(i => i.id === id ? { ...i, ...patch } : i)),
    remove: (id: string) => setList(list.filter(i => i.id !== id)),
  };
}

export function useFinDividas() {
  const [list, setList] = useStored<FinDivida[]>(K.dividas, []);
  return {
    dividas: list,
    add: (d: Omit<FinDivida, 'id' | 'data_criacao'>) =>
      setList([{ ...d, id: uuid(), data_criacao: new Date().toISOString() }, ...list]),
    update: (id: string, patch: Partial<FinDivida>) =>
      setList(list.map(i => i.id === id ? { ...i, ...patch } : i)),
    remove: (id: string) => setList(list.filter(i => i.id !== id)),
  };
}
