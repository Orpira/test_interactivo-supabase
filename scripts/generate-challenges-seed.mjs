// Genera los seeds SQL de retos (Fase 1), incidencias (Fase 3) y aprendizaje (Fase 4) desde el código TS.
// Uso: npm run db:challenges-seed
import { build } from "esbuild";
import { writeFileSync, mkdtempSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const out = join(mkdtempSync(join(tmpdir(), "webwiz-")), "seed.mjs");

await build({
	stdin: {
		contents: `export { challengeCatalog } from "@/content/challenges";
export { INCIDENTS } from "@/content/incidents";
export { challengesToSql, incidentsToSql } from "@/content/challenges/toSql";
export { PREDICT_QUESTIONS } from "@/content/questions/predict";
export { learningSeedSql } from "@/content/questions/toSql";
export { topicChallenges } from "@/content/topics";
export { REVIEWS } from "@/content/reviews";
export { EXPLAIN_PROMPTS } from "@/content/explain";
export { phase5SeedSql } from "@/content/topics/toSql";`,
		resolveDir: root,
	},
	bundle: true,
	platform: "node",
	format: "esm",
	outfile: out,
	alias: { "@": join(root, "src") },
	logLevel: "error",
});

const { challengeCatalog, challengesToSql, INCIDENTS, incidentsToSql, PREDICT_QUESTIONS, learningSeedSql, topicChallenges, REVIEWS, EXPLAIN_PROMPTS, phase5SeedSql } = await import(
	pathToFileURL(out).href
);
const target = join(root, "supabase/migrations/20261029_fase1_retos_seed.sql");
writeFileSync(target, challengesToSql(challengeCatalog));
console.log(`✔ ${challengeCatalog.length} retos → ${target}`);

const incidentsTarget = join(root, "supabase/migrations/20261030_fase3_incidencias_seed.sql");
writeFileSync(incidentsTarget, incidentsToSql(INCIDENTS));
console.log(`✔ ${INCIDENTS.length} incidencias → ${incidentsTarget}`);

const learningTarget = join(root, "supabase/migrations/20261031_fase4_aprendizaje_seed.sql");
writeFileSync(learningTarget, learningSeedSql(PREDICT_QUESTIONS));
console.log(`✔ conceptos y ${PREDICT_QUESTIONS.length} preguntas de predicción → ${learningTarget}`);

const phase5Target = join(root, "supabase/migrations/20261101_fase5_ia_temas_seed.sql");
writeFileSync(phase5Target, phase5SeedSql(topicChallenges, REVIEWS, EXPLAIN_PROMPTS));
console.log(`✔ ${topicChallenges.length} retos, ${REVIEWS.length} revisiones y ${EXPLAIN_PROMPTS.length} preguntas abiertas → ${phase5Target}`);
