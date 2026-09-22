ALTER TABLE public.atendimentos
  ADD COLUMN IF NOT EXISTS modalidade text NOT NULL DEFAULT 'REMOTA',
  ADD COLUMN IF NOT EXISTS tem_traslado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS traslado_origem text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS traslado_destino text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS traslado_saida text,
  ADD COLUMN IF NOT EXISTS traslado_retorno text,
  ADD COLUMN IF NOT EXISTS traslado_km numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS traslado_valor numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS traslado_obs text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS valor_cafe numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_almoco numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_jantar numeric NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.atendimento_anexos (
  id text PRIMARY KEY,
  atendimento_id text NOT NULL,
  nome text NOT NULL,
  path text NOT NULL,
  tamanho bigint NOT NULL DEFAULT 0,
  tipo text NOT NULL DEFAULT '',
  data_criacao timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.atendimento_anexos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.atendimento_anexos TO authenticated;
GRANT ALL ON public.atendimento_anexos TO service_role;

ALTER TABLE public.atendimento_anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public rw anexos" ON public.atendimento_anexos
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_anexos_atendimento ON public.atendimento_anexos (atendimento_id);