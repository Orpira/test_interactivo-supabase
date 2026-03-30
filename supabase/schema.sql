-- =============================================
-- Schema SQL para Supabase
-- =============================================

-- Tabla: questions (preguntas de quiz)
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  "correctAnswer" TEXT NOT NULL,
  category TEXT NOT NULL,
  "shortExplanation" TEXT,
  "sourceUrl" TEXT,
  "sourceName" TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: questionsExplain (preguntas con explicación)
CREATE TABLE IF NOT EXISTS "questionsExplain" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  "correctAnswer" INTEGER NOT NULL,
  category TEXT NOT NULL,
  "shortExplanation" TEXT,
  "sourceUrl" TEXT,
  "sourceName" TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: challenges (retos de código)
CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  instructions TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  "starterCode" TEXT,
  "initialCode" TEXT,
  "expectedOutput" TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: resultados (resultados de quiz)
CREATE TABLE IF NOT EXISTS resultados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT,
  "userId" TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  category TEXT NOT NULL,
  summary JSONB,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Tabla: envios_codigo (envíos de código del editor)
CREATE TABLE IF NOT EXISTS envios_codigo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" TEXT NOT NULL,
  name TEXT,
  email TEXT,
  language TEXT NOT NULL,
  code TEXT NOT NULL,
  category TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Tabla: user_stats (estadísticas de usuario)
CREATE TABLE IF NOT EXISTS user_stats (
  email TEXT PRIMARY KEY,
  stats JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE "questionsExplain" ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados ENABLE ROW LEVEL SECURITY;
ALTER TABLE envios_codigo ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Lectura pública para preguntas y retos
CREATE POLICY "Lectura pública de questions" ON questions
  FOR SELECT USING (true);

CREATE POLICY "Lectura pública de questionsExplain" ON "questionsExplain"
  FOR SELECT USING (true);

CREATE POLICY "Lectura pública de challenges" ON challenges
  FOR SELECT USING (true);

-- Resultados: lectura pública, escritura solo autenticados
CREATE POLICY "Lectura pública de resultados" ON resultados
  FOR SELECT USING (true);

CREATE POLICY "Insertar resultados autenticados" ON resultados
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Envíos de código: lectura/escritura solo del propio usuario
CREATE POLICY "Usuarios ven sus envios" ON envios_codigo
  FOR SELECT USING (auth.uid()::text = "userId");

CREATE POLICY "Usuarios insertan sus envios" ON envios_codigo
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

-- User stats: lectura/escritura solo del propio usuario
CREATE POLICY "Usuarios ven sus stats" ON user_stats
  FOR SELECT USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Usuarios actualizan sus stats" ON user_stats
  FOR ALL USING (auth.jwt() ->> 'email' = email);

-- =============================================
-- Índices para performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_challenges_category ON challenges(category);
CREATE INDEX IF NOT EXISTS idx_resultados_userId ON resultados("userId");
CREATE INDEX IF NOT EXISTS idx_resultados_score ON resultados(score DESC);
CREATE INDEX IF NOT EXISTS idx_resultados_timestamp ON resultados(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_envios_userId ON envios_codigo("userId");
