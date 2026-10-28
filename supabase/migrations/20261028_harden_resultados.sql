-- =============================================================
-- Migración: endurecer la tabla resultados y sincronizar questions
-- Ejecutar en el SQL Editor de Supabase (es idempotente).
-- =============================================================

-- 1. questions.subcategory: la app ya filtra por esta columna, pero no
--    figuraba en schema.sql. Se crea solo si no existe.
ALTER TABLE questions ADD COLUMN IF NOT EXISTS subcategory TEXT;
CREATE INDEX IF NOT EXISTS idx_questions_category_subcategory
  ON questions(category, subcategory);

-- 2. Solo puedes insertar resultados a tu nombre.
--    Antes bastaba con estar autenticado: cualquiera podía insertar
--    resultados con el userId de otra persona y manipular el ranking.
DROP POLICY IF EXISTS "Insertar resultados autenticados" ON resultados;
DROP POLICY IF EXISTS "Insertar resultados propios" ON resultados;
CREATE POLICY "Insertar resultados propios" ON resultados
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = "userId");

-- 3. Valores coherentes (NOT VALID: no revisa filas antiguas, solo nuevas).
ALTER TABLE resultados DROP CONSTRAINT IF EXISTS resultados_score_valido;
ALTER TABLE resultados
  ADD CONSTRAINT resultados_score_valido
  CHECK (total BETWEEN 1 AND 50 AND score BETWEEN 0 AND total) NOT VALID;

-- 4. Privacidad: resultados tiene lectura pública (alimenta el ranking),
--    así que el email de cada usuario era legible con la anon key.
--    La app ya no lo guarda; aquí se rellena el nombre que faltaba con la
--    parte local del email y se borran los emails existentes.
UPDATE resultados
SET name = split_part(email, '@', 1)
WHERE (name IS NULL OR btrim(name) = '') AND email IS NOT NULL;

UPDATE resultados SET email = NULL WHERE email IS NOT NULL;

-- Índice para el historial del usuario ordenado por fecha
CREATE INDEX IF NOT EXISTS idx_resultados_user_timestamp
  ON resultados("userId", timestamp DESC);
