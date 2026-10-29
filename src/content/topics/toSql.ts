import { EXTRA_CONCEPTS } from "@/features/learning/concepts";
import type { ChallengeSpec } from "@/features/challenges/engine/types";
import type { ReviewSpec } from "@/features/reviews/types";
import type { ExplainPrompt } from "@/content/explain";

const TAG = "$webwiz5$";
const literal = (v: string) => `'${v.replace(/'/g, "''")}'`;
const dollar = (v: string) => {
	if (v.includes(TAG)) throw new Error(`El contenido incluye ${TAG}`);
	return `${TAG}${v}${TAG}`;
};
const textArray = (xs: string[]) => `ARRAY[${xs.map(literal).join(", ")}]::TEXT[]`;

/** Seed de la Fase 5: conceptos, retos de los temas nuevos, revisiones y "Explícalo tú". Idempotente. */
export function phase5SeedSql(topics: ChallengeSpec[], reviews: ReviewSpec[], prompts: ExplainPrompt[]): string {
	const concepts = EXTRA_CONCEPTS.map((c) => `  (${literal(c.id)}, ${literal(c.name)}, ${literal(c.area)})`).join(",\n");
	const challengeRows = [
		...topics.map((c) => `  (${literal(c.id)}, ${literal(c.title)}, ${literal(c.instructions)}, ${literal(c.category)}, 'challenge', ${literal(c.difficulty)}, ${textArray(c.concepts)}, ${dollar(JSON.stringify(c))}::jsonb, false)`),
		...reviews.map((r) => `  (${literal(r.id)}, ${literal(r.title)}, ${literal(r.description)}, 'revisiones', 'review', ${literal(r.difficulty)}, ${textArray([...new Set(r.issues.flatMap((i) => i.concepts))])}, ${dollar(JSON.stringify(r))}::jsonb, false)`),
	].join(",\n");
	const explainRows = prompts
		.map(
			(p) =>
				`  (${literal(p.id)}::uuid, ${dollar(p.question)}, '[]'::jsonb, '', 'explicalo', ${literal(p.concept)}, ${literal(p.difficulty)}, ${dollar(p.modelAnswer)}, ARRAY[${literal(p.concept)}]::TEXT[], 'explain', ${p.code ? dollar(p.code) : "NULL"}, ${dollar(JSON.stringify({ keyPoints: p.keyPoints, misconceptions: p.misconceptions }))}::jsonb)`,
		)
		.join(",\n");

	return `-- Generado por \`npm run db:challenges-seed\` (src/content/topics, reviews y explain). No editar a mano.
-- Ejecutar DESPUÉS de 20261101_fase5_ia_temas.sql.

-- 1. Conceptos de los temas nuevos
INSERT INTO concepts (id, name, area) VALUES
${concepts}
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, area = EXCLUDED.area;

-- 2. Retos de accesibilidad, seguridad y rendimiento + revisiones de código de IA
INSERT INTO challenges (id, title, instructions, category, type, difficulty, concepts, spec, legacy)
VALUES
${challengeRows}
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  instructions = EXCLUDED.instructions,
  category = EXCLUDED.category,
  type = EXCLUDED.type,
  difficulty = EXCLUDED.difficulty,
  concepts = EXCLUDED.concepts,
  spec = EXCLUDED.spec,
  legacy = false;

-- 3. "Explícalo tú": la rúbrica va en option_meta y solo la usa la Edge Function
INSERT INTO questions (id, question, options, "correctAnswer", category, subcategory, difficulty, "shortExplanation", concepts, kind, code, option_meta)
VALUES
${explainRows}
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  subcategory = EXCLUDED.subcategory,
  difficulty = EXCLUDED.difficulty,
  "shortExplanation" = EXCLUDED."shortExplanation",
  concepts = EXCLUDED.concepts,
  kind = EXCLUDED.kind,
  code = EXCLUDED.code,
  option_meta = EXCLUDED.option_meta;
`;
}
