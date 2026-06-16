-- Migración: agregar columna difficulty a questions
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columna si no existe
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'junior'
  CHECK (difficulty IN ('junior', 'semi_senior', 'senior'));

-- 2. Índices para filtrar por nivel
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_category_difficulty ON questions(category, difficulty);

-- 3. Clasificar preguntas existentes por heurísticas de palabras clave.
--    Preguntas con términos avanzados → senior
--    Preguntas con términos intermedios → semi_senior
--    El resto queda como junior (default)

-- Senior: conceptos avanzados y de arquitectura
UPDATE questions SET difficulty = 'senior'
WHERE difficulty = 'junior'
  AND (
    question ~* '(patrón de diseño|design pattern|SOLID|arquitectura|microservicio|event loop|closure|prototype chain|web worker|service worker|virtualización|orquest|kubernetes|k8s|terraform|helm|istio|CI/CD avanzad|pipeline comple|infraestructura como código|IaC|serverless|lambda|observabilidad|SRE|chaos engineer|canary deploy|blue.green|rolling update|gitops|rendimiento|profiling|tree.shaking|code splitting|lazy load|hydration|SSR|SSG|ISR|concurren|race condition|deadlock|mutex|semáfor|garbage collect|memory leak|BigO|complejid|recursiv|memoiza|currying|composición de funciones|functor|monad|higher.order|decorat|proxy pattern|reflect|symbol|generator|iterator|async iterator|buffer|stream|WASM|WebAssembly|WebSocket|gRPC|GraphQL avanzad|federation|schema stitch|optimistic update|CQRS|event sourc|saga pattern|DDD|domain.driven|hexagonal|clean arch|onion arch|CIDR|subnet|load balanc|reverse proxy|CDN|edge comput|sharding|replicación|índice compuesto|explain analyze|query plan|transacción|isolation level|ACID|CAP theorem|eventual consist)'
  );

-- Semi-senior: conceptos intermedios
UPDATE questions SET difficulty = 'semi_senior'
WHERE difficulty = 'junior'
  AND (
    question ~* '(hook personalizado|custom hook|useCallback|useMemo|useRef|useReducer|useContext|context API|Redux|Zustand|state management|middleware|interceptor|autenticación|JWT|OAuth|CORS|CSRF|XSS|inyección|sanitiz|validación|testing|test unitario|jest|vitest|cypress|playwright|mock|stub|spy|TDD|BDD|integration test|e2e|end.to.end|Docker|contenedor|imagen|Dockerfile|docker.compose|CI/CD|GitHub Actions|Jenkins|deploy|despliegue|nginx|Apache|proxy|env|variable de entorno|API REST|endpoint|status code|HTTP method|promise\.all|promise\.race|promise\.allSettled|async\/await|try.catch|error handling|manejo de error|TypeScript avanzad|generic|tipo genéric|utility type|mapped type|conditional type|infer|discriminated union|type guard|assertion|interface vs type|abstract|herencia|polimorfism|encapsulam|SOLID principi|single responsib|open.closed|dependency inject|inversión de depend|patrón observ|patrón MVC|patrón MVVM|SQL join|foreign key|relación|normalización|migración|ORM|Prisma|Sequelize|Supabase|Firebase|índice|aggregate|GROUP BY|HAVING|subquery|subconsulta|CTE|window function|webpack|vite|bundler|babel|transpil|módulo ES|import dinámico|optimización|accesibilidad|a11y|ARIA|semántic|SEO|meta tag|sitemap|schema\.org|responsive avanzad|media query comple|grid avanzad|flexbox avanzad|animación CSS|keyframe|transition|transform|pseudo.element|pseudo.class|specificity|especificidad|BEM|CSS module|styled.component|tailwind config|tema personaliz|dark mode|variable CSS|custom propert)'
  );

-- Verificar distribución resultante
-- SELECT difficulty, count(*) FROM questions GROUP BY difficulty ORDER BY difficulty;
