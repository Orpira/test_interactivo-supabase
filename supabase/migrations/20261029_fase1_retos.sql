-- =============================================================
-- Fase 1 — Retos con tests y registro de intentos
-- Ejecutar en el SQL Editor de Supabase ANTES de 20261029_fase1_retos_seed.sql.
-- Solo aditiva e idempotente: no borra datos existentes.
-- =============================================================

-- 1. Nuevas columnas en challenges
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'challenge',
  ADD COLUMN IF NOT EXISTS difficulty TEXT,
  ADD COLUMN IF NOT EXISTS concepts TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS spec JSONB,          -- files, editable, tests, hints, solution…
  ADD COLUMN IF NOT EXISTS legacy BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_type_check;
ALTER TABLE challenges
  ADD CONSTRAINT challenges_type_check CHECK (type IN ('challenge', 'incident', 'review'));

-- Los retos antiguos pueden traer niveles en otro formato ("principiante"…)
-- y una restricción previa con esos valores: se sustituye y se normalizan.
-- (Cualquier UPDATE posterior sobre una fila con un nivel no admitido fallaría.)
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_difficulty_check;
UPDATE challenges SET difficulty = CASE
    WHEN lower(trim(difficulty)) IN ('principiante', 'basico', 'básico', 'facil', 'fácil', 'beginner', 'easy', 'junior') THEN 'junior'
    WHEN lower(trim(difficulty)) IN ('intermedio', 'medio', 'intermediate', 'medium', 'semi_senior', 'semi-senior', 'semisenior', 'semi senior') THEN 'semi_senior'
    WHEN lower(trim(difficulty)) IN ('avanzado', 'dificil', 'difícil', 'advanced', 'hard', 'experto', 'senior') THEN 'senior'
    ELSE 'junior'
  END
WHERE difficulty IS NOT NULL AND difficulty NOT IN ('junior', 'semi_senior', 'senior');
ALTER TABLE challenges
  ADD CONSTRAINT challenges_difficulty_check
  CHECK (difficulty IS NULL OR difficulty IN ('junior', 'semi_senior', 'senior'));

-- 2. Los 150 retos antiguos (3 enunciados repetidos, sin tests) quedan ocultos
UPDATE challenges SET legacy = true WHERE spec IS NULL AND legacy = false;

CREATE INDEX IF NOT EXISTS idx_challenges_visible
  ON challenges (category, difficulty) WHERE legacy = false;

-- 3. Intentos de cada usuario
CREATE TABLE IF NOT EXISTS challenge_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  code JSONB NOT NULL,               -- archivos editables enviados
  results JSONB NOT NULL,            -- [{ name, passed, message }]
  passed BOOLEAN NOT NULL,
  hints_used INT NOT NULL DEFAULT 0 CHECK (hints_used >= 0),
  duration_ms INT CHECK (duration_ms IS NULL OR duration_ms >= 0),
  timeline JSONB,                    -- Fase 3: eventos del diagnóstico
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attempts_user_created
  ON challenge_attempts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_challenge
  ON challenge_attempts (challenge_id);

ALTER TABLE challenge_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios ven sus intentos" ON challenge_attempts;
CREATE POLICY "Usuarios ven sus intentos" ON challenge_attempts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios registran sus intentos" ON challenge_attempts;
CREATE POLICY "Usuarios registran sus intentos" ON challenge_attempts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
