ALTER TABLE public.atendimentos
  ADD COLUMN IF NOT EXISTS houve_traslado boolean,
  ADD COLUMN IF NOT EXISTS houve_refeicao boolean,
  ADD COLUMN IF NOT EXISTS traslado_horas numeric NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.configuracoes (
  id text PRIMARY KEY,
  valor jsonb NOT NULL DEFAULT '{}'::jsonb,
  data_criacao timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes TO anon, authenticated;
GRANT ALL ON public.configuracoes TO service_role;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public rw configuracoes" ON public.configuracoes FOR ALL USING (true) WITH CHECK (true);