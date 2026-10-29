import { AREA_RULES, CONCEPT_CATALOG } from "@/features/learning/concepts";
import type { PredictQuestion } from "./predict";

const TAG = "$webwiz$";
const literal = (value: string) => `'${value.replace(/'/g, "''")}'`;
const dollar = (value: string) => {
	if (value.includes(TAG)) throw new Error(`El texto contiene ${TAG}`);
	return `${TAG}${value}${TAG}`;
};

/** webwiz_area(subcategoría, categoría): misma lógica que areaFor() en concepts.ts. */
function areaFunctionSql(): string {
	const when = (expr: string) => AREA_RULES.map(([re, area]) => `    WHEN ${expr} ~ ${literal(re)} THEN ${literal(area)}`).join("\n");
	return `CREATE OR REPLACE FUNCTION webwiz_area(p_text TEXT, p_category TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $fn$
  SELECT CASE
${when("lower(coalesce(p_text, ''))")}
    WHEN lower(coalesce(p_category, '')) = 'frontend' THEN 'JavaScript'
    WHEN lower(coalesce(p_category, '')) = 'backend' THEN 'Backend'
    WHEN lower(coalesce(p_category, '')) = 'devops' THEN 'DevOps'
    WHEN lower(coalesce(p_category, '')) = 'testing' THEN 'Testing'
    WHEN lower(coalesce(p_category, '')) = 'linux' THEN 'Linux'
${when("lower(coalesce(p_category, ''))")}
    ELSE 'JavaScript'
  END
$fn$;`;
}

/**
 * Seed de la Fase 4: funciones de conceptos, catálogo, conceptos derivados de
 * las preguntas existentes y preguntas de predicción. Idempotente.
 */
export function learningSeedSql(questions: PredictQuestion[]): string {
	const catalog = CONCEPT_CATALOG.map((c) => `  (${literal(c.id)}, ${literal(c.name)}, ${literal(c.area)})`).join(",\n");
	const rows = questions
		.map((q) => {
			const concepts = `ARRAY[${q.concepts.map(literal).join(", ")}]::TEXT[]`;
			return `  (${literal(q.id)}::uuid, ${literal(q.question)}, ${dollar(JSON.stringify(q.options))}::jsonb, ${dollar(q.correctAnswer)}, 'frontend', 'JavaScript', ${literal(q.difficulty)}, ${dollar(q.shortExplanation)}, ${concepts}, 'predict', ${dollar(q.code)}, ${dollar(JSON.stringify(q.optionMeta))}::jsonb)`;
		})
		.join(",\n");

	return `-- Generado por \`npm run db:challenges-seed\` (src/features/learning/concepts.ts y
-- src/content/questions/predict.ts). No editar a mano.
-- Ejecutar DESPUÉS de 20261031_fase4_aprendizaje.sql.

-- 1. Slug y área (equivalentes a slugify() y areaFor() del cliente)
CREATE OR REPLACE FUNCTION webwiz_slug(p_text TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $fn$
  SELECT trim(both '-' from regexp_replace(
    lower(translate(coalesce(p_text, ''),
      'ÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇáàäâãéèëêíìïîóòöôõúùüûñç',
      'AAAAAEEEEIIIIOOOOOUUUUNCaaaaaeeeeiiiiooooouuuunc')),
    '[^a-z0-9]+', '-', 'g'))
$fn$;

${areaFunctionSql()}

-- 2. Catálogo curado
INSERT INTO concepts (id, name, area) VALUES
${catalog}
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, area = EXCLUDED.area;

-- 3. Un concepto por subcategoría (o categoría) de las preguntas existentes
INSERT INTO concepts (id, name, area)
SELECT DISTINCT ON (webwiz_slug(base))
  webwiz_slug(base), upper(left(base, 1)) || substr(base, 2), webwiz_area(subcategory, category)
FROM (
  SELECT coalesce(nullif(trim(subcategory), ''), nullif(trim(category), '')) AS base, subcategory, category
  FROM questions
) q
WHERE base IS NOT NULL AND webwiz_slug(base) <> ''
ON CONFLICT (id) DO NOTHING;

UPDATE questions
SET concepts = ARRAY[webwiz_slug(coalesce(nullif(trim(subcategory), ''), nullif(trim(category), '')))]
WHERE (concepts IS NULL OR concepts = '{}')
  AND webwiz_slug(coalesce(nullif(trim(subcategory), ''), nullif(trim(category), ''))) <> '';

-- 4. Preguntas de predicción ("¿Qué imprime este código?")
INSERT INTO questions (id, question, options, "correctAnswer", category, subcategory, difficulty, "shortExplanation", concepts, kind, code, option_meta)
VALUES
${rows}
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  "correctAnswer" = EXCLUDED."correctAnswer",
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  difficulty = EXCLUDED.difficulty,
  "shortExplanation" = EXCLUDED."shortExplanation",
  concepts = EXCLUDED.concepts,
  kind = EXCLUDED.kind,
  code = EXCLUDED.code,
  option_meta = EXCLUDED.option_meta;
`;
}
