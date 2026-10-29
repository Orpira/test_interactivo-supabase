-- =============================================================
-- Fase 4 — Conceptos, confianza, repaso espaciado, racha y liga
-- Ejecutar DESPUÉS de las migraciones anteriores y ANTES de
-- 20261031_fase4_aprendizaje_seed.sql. Aditiva e idempotente.
-- =============================================================

-- 1. Preguntas: conceptos, tipo, código y metadatos de opciones
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS concepts TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'choice',
  ADD COLUMN IF NOT EXISTS code TEXT,
  ADD COLUMN IF NOT EXISTS option_meta JSONB;   -- {"<opción>": {misconception, whyTempting}}

ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_kind_check;
ALTER TABLE questions
  ADD CONSTRAINT questions_kind_check CHECK (kind IN ('choice', 'predict', 'explain'));

CREATE INDEX IF NOT EXISTS idx_questions_concepts ON questions USING GIN (concepts);

-- 2. Conceptos (lectura pública)
CREATE TABLE IF NOT EXISTS concepts (
  id TEXT PRIMARY KEY,               -- 'event-loop'
  name TEXT NOT NULL,
  area TEXT NOT NULL                 -- HTML, CSS, JavaScript, Backend, Linux, DevOps, Testing
);

-- 3. Respuestas con confianza
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  chosen TEXT,
  correct BOOLEAN NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('adivino', 'creo', 'seguro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_answers_user_created ON answers (user_id, created_at DESC);

-- 4. Tarjeta FSRS por usuario y concepto
CREATE TABLE IF NOT EXISTS concept_cards (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  fsrs JSONB NOT NULL,               -- tarjeta serializada (ts-fsrs) + motivo del estado
  due TIMESTAMPTZ NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('dominado', 'progreso', 'reforzar', 'nuevo')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, concept_id)
);
CREATE INDEX IF NOT EXISTS idx_concept_cards_due ON concept_cards (user_id, due);

-- 5. Racha con protector semanal
CREATE TABLE IF NOT EXISTS streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current INT NOT NULL DEFAULT 0 CHECK (current >= 0),
  best INT NOT NULL DEFAULT 0 CHECK (best >= 0),
  freezes INT NOT NULL DEFAULT 1 CHECK (freezes BETWEEN 0 AND 1),
  last_active DATE,
  detail JSONB,                      -- días completados y protegidos (puntos de la semana)
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. RLS
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de concepts" ON concepts;
CREATE POLICY "Lectura pública de concepts" ON concepts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuarios ven sus respuestas" ON answers;
CREATE POLICY "Usuarios ven sus respuestas" ON answers
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Usuarios registran sus respuestas" ON answers;
CREATE POLICY "Usuarios registran sus respuestas" ON answers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios gestionan sus tarjetas" ON concept_cards;
CREATE POLICY "Usuarios gestionan sus tarjetas" ON concept_cards
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios gestionan su racha" ON streaks;
CREATE POLICY "Usuarios gestionan su racha" ON streaks
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. Liga semanal: grupos de 20 por nivel, puntos = suma de aciertos de la
-- semana (tabla resultados). Devuelve solo el grupo de quien la consulta.
CREATE OR REPLACE FUNCTION weekly_league(p_week_start DATE DEFAULT NULL)
RETURNS TABLE (user_id TEXT, name TEXT, points INT, "position" INT, is_me BOOLEAN, level TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  WITH wk AS (
    SELECT coalesce(p_week_start, date_trunc('week', now())::date) AS s
  ),
  me AS (SELECT auth.uid()::text AS uid),
  pts AS (
    SELECT r."userId" AS uid, max(r.name) AS name, sum(r.score)::int AS points
    FROM resultados r, wk
    WHERE r.timestamp >= wk.s AND r.timestamp < wk.s + 7
    GROUP BY r."userId"
  ),
  everyone AS (
    SELECT p.uid, p.name, p.points FROM pts p
    UNION ALL
    SELECT me.uid, NULL, 0 FROM me
    WHERE me.uid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM pts WHERE pts.uid = me.uid)
  ),
  leveled AS (
    SELECT e.*, coalesce(ue.level, 'junior') AS level
    FROM everyone e LEFT JOIN user_experience ue ON ue.user_id::text = e.uid
  ),
  grouped AS (
    SELECT l.*, (row_number() OVER (PARTITION BY l.level ORDER BY md5(l.uid || (SELECT s FROM wk)::text)) - 1) / 20 AS grp
    FROM leveled l
  ),
  mine AS (SELECT g.level, g.grp FROM grouped g, me WHERE g.uid = me.uid)
  SELECT g.uid, coalesce(g.name, 'Tú'), g.points,
         (row_number() OVER (ORDER BY g.points DESC, g.name))::int,
         g.uid = (SELECT uid FROM me), g.level
  FROM grouped g JOIN mine m ON m.level = g.level AND m.grp = g.grp
  ORDER BY 4;
$fn$;

REVOKE ALL ON FUNCTION weekly_league(DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION weekly_league(DATE) TO authenticated;
