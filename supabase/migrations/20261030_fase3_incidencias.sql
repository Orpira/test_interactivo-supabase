-- =============================================================
-- Fase 3 — Modo Incidencia
-- Ejecutar DESPUÉS de las migraciones de la Fase 1 y ANTES de
-- 20261030_fase3_incidencias_seed.sql. Aditiva e idempotente.
-- =============================================================

-- Puntuación del cierre (la línea de tiempo va en la columna timeline,
-- creada en la Fase 1)
ALTER TABLE challenge_attempts
  ADD COLUMN IF NOT EXISTS score INT;

ALTER TABLE challenge_attempts DROP CONSTRAINT IF EXISTS challenge_attempts_score_check;
ALTER TABLE challenge_attempts
  ADD CONSTRAINT challenge_attempts_score_check CHECK (score IS NULL OR score BETWEEN 0 AND 5000);

-- La línea de tiempo es una lista de eventos acotada (máx. 60 en la app)
ALTER TABLE challenge_attempts DROP CONSTRAINT IF EXISTS challenge_attempts_timeline_check;
ALTER TABLE challenge_attempts
  ADD CONSTRAINT challenge_attempts_timeline_check
  CHECK (timeline IS NULL OR (jsonb_typeof(timeline) = 'array' AND jsonb_array_length(timeline) <= 100));

-- Historial de incidencias cerradas de cada usuario
CREATE INDEX IF NOT EXISTS idx_attempts_user_passed
  ON challenge_attempts (user_id, passed, created_at DESC);
