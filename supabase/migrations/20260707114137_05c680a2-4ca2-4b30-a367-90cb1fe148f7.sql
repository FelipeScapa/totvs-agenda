
-- ATENDIMENTOS
CREATE TABLE public.atendimentos (
  id TEXT PRIMARY KEY,
  cliente TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL,
  servico_id TEXT,
  data DATE NOT NULL,
  hora_inicio TEXT NOT NULL,
  hora_fim TEXT NOT NULL,
  duracao_horas NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  observacoes TEXT NOT NULL DEFAULT '',
  intervalo_inicio TEXT,
  intervalo_fim TEXT,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.atendimentos TO anon, authenticated;
GRANT ALL ON public.atendimentos TO service_role;
ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read atendimentos" ON public.atendimentos FOR SELECT USING (true);
CREATE POLICY "public write atendimentos" ON public.atendimentos FOR INSERT WITH CHECK (true);
CREATE POLICY "public update atendimentos" ON public.atendimentos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete atendimentos" ON public.atendimentos FOR DELETE USING (true);

-- CLIENTES
CREATE TABLE public.clientes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO anon, authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public rw clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);

-- SERVICOS
CREATE TABLE public.servicos (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  valor_hora NUMERIC NOT NULL DEFAULT 0,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.servicos TO anon, authenticated;
GRANT ALL ON public.servicos TO service_role;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public rw servicos" ON public.servicos FOR ALL USING (true) WITH CHECK (true);

-- TIPOS DE ATENDIMENTO
CREATE TABLE public.tipos_atendimento (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tipos_atendimento TO anon, authenticated;
GRANT ALL ON public.tipos_atendimento TO service_role;
ALTER TABLE public.tipos_atendimento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public rw tipos" ON public.tipos_atendimento FOR ALL USING (true) WITH CHECK (true);

-- FERIADOS
CREATE TABLE public.feriados (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feriados TO anon, authenticated;
GRANT ALL ON public.feriados TO service_role;
ALTER TABLE public.feriados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public rw feriados" ON public.feriados FOR ALL USING (true) WITH CHECK (true);

-- PENDENCIAS
CREATE TABLE public.pendencias (
  id TEXT PRIMARY KEY,
  cliente TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  prioridade TEXT NOT NULL,
  status TEXT NOT NULL,
  prazo DATE,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pendencias TO anon, authenticated;
GRANT ALL ON public.pendencias TO service_role;
ALTER TABLE public.pendencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public rw pendencias" ON public.pendencias FOR ALL USING (true) WITH CHECK (true);
