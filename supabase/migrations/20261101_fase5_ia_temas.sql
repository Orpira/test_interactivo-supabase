-- =============================================================
-- Fase 5 — Revisión de código de IA, "Explícalo tú", temas nuevos
-- y editor de contenido. Ejecutar tras las de la Fase 4 y ANTES de
-- 20261101_fase5_ia_temas_seed.sql. Aditiva e idempotente.
-- =============================================================

-- 1. Correcciones de Claude ("Explícalo tú"). Solo escribe la Edge Function
--    (service role); cada usuario lee las suyas.
CREATE TABLE IF NOT EXISTS explain_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL CHECK (char_length(answer) <= 1500),
  answer_hash TEXT NOT NULL,
  review JSONB NOT NULL,
  cached BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_explain_cache ON explain_reviews (question_id, answer_hash);
CREATE INDEX IF NOT EXISTS idx_explain_user_day ON explain_reviews (user_id, created_at DESC);

ALTER TABLE explain_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuarios ven sus correcciones" ON explain_reviews;
CREATE POLICY "Usuarios ven sus correcciones" ON explain_reviews
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 2. Roles de contenido: quién puede publicar en /crear
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('editor', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuarios ven sus roles" ON user_roles;
CREATE POLICY "Usuarios ven sus roles" ON user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- (Los roles se asignan desde el panel de Supabase o con la service role:
--  INSERT INTO user_roles (user_id, role) VALUES ('<uuid>', 'editor');)

CREATE OR REPLACE FUNCTION is_content_editor() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('editor', 'admin'))
$fn$;
GRANT EXECUTE ON FUNCTION is_content_editor() TO authenticated;

-- 3. Contenido de la comunidad: los editores publican retos e incidencias
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Editores publican contenido" ON challenges;
CREATE POLICY "Editores publican contenido" ON challenges
  FOR INSERT TO authenticated
  WITH CHECK (is_content_editor() AND author_id = auth.uid() AND type IN ('challenge', 'incident') AND spec IS NOT NULL);

DROP POLICY IF EXISTS "Editores actualizan su contenido" ON challenges;
CREATE POLICY "Editores actualizan su contenido" ON challenges
  FOR UPDATE TO authenticated
  USING (is_content_editor() AND author_id = auth.uid())
  WITH CHECK (is_content_editor() AND author_id = auth.uid());
