// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { challengeCatalog } from "../../src/content/challenges";
import { challengesToSql, incidentsToSql } from "../../src/content/challenges/toSql";
import { INCIDENTS } from "../../src/content/incidents";
import { PREDICT_QUESTIONS } from "../../src/content/questions/predict";
import { learningSeedSql } from "../../src/content/questions/toSql";
import { phase5SeedSql } from "../../src/content/topics/toSql";
import { topicChallenges } from "../../src/content/topics";
import { REVIEWS } from "../../src/content/reviews";
import { EXPLAIN_PROMPTS } from "../../src/content/explain";
import { areaFor, conceptsForQuestion, slugify } from "../../src/features/learning/concepts";

const dir = join(__dirname, "../../supabase");

describe("esquema y migraciones de Supabase", () => {
	it("se aplican sobre schema.sql en un Postgres real y son idempotentes", async () => {
		const db = new PGlite();
		// Stubs mínimos de Supabase (auth)
		await db.exec(`
			CREATE SCHEMA auth;
			CREATE TABLE auth.users (id UUID PRIMARY KEY);
			CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql AS $$ SELECT NULL::uuid $$;
			CREATE FUNCTION auth.role() RETURNS TEXT LANGUAGE sql AS $$ SELECT 'anon' $$;
			CREATE FUNCTION auth.jwt() RETURNS JSONB LANGUAGE sql AS $$ SELECT '{}'::jsonb $$;
			CREATE ROLE authenticated; CREATE ROLE anon;
		`);
		await db.exec(readFileSync(join(dir, "schema.sql"), "utf8"));
		await db.exec(
			`INSERT INTO challenges (id, title, instructions, category) VALUES ('html-01', 'Reto antiguo', 'x', 'html');`,
		);
		// Preguntas "antiguas" para comprobar la derivación de conceptos
		const legacy: [string, string | null][] = [
			["frontend", "Flexbox"],
			["frontend", "Árboles DOM & Eventos"],
			["devops", "CI/CD"],
			["backend", null],
			["css", null],
		];
		for (const [cat, sub] of legacy) {
			await db.query(`INSERT INTO questions (question, options, "correctAnswer", category, subcategory) VALUES ('q', '["a","b"]', 'a', $1, $2)`, [cat, sub]);
		}
		const files = readdirSync(join(dir, "migrations")).sort();
		for (let pass = 0; pass < 2; pass++) {
			for (const f of files) await db.exec(readFileSync(join(dir, "migrations", f), "utf8"));
		}
		const { rows } = await db.query<{ visibles: number; legacy: number }>(
			`SELECT count(*) FILTER (WHERE NOT legacy)::int AS visibles,
			        count(*) FILTER (WHERE legacy)::int AS legacy FROM challenges`,
		);
		expect(rows[0]).toEqual({ visibles: challengeCatalog.length + INCIDENTS.length + topicChallenges.length + REVIEWS.length, legacy: 1 });
		const types = await db.query<{ type: string; n: number }>(
			`SELECT type, count(*)::int AS n FROM challenges WHERE NOT legacy GROUP BY type ORDER BY type`,
		);
		expect(types.rows).toEqual([
			{ type: "challenge", n: challengeCatalog.length + topicChallenges.length },
			{ type: "incident", n: INCIDENTS.length },
			{ type: "review", n: REVIEWS.length },
		]);
		// Fase 5: preguntas abiertas con rúbrica y conceptos de los temas nuevos
		const explain = await db.query<{ n: number }>(`SELECT count(*)::int AS n FROM questions WHERE kind = 'explain' AND jsonb_array_length(option_meta->'keyPoints') = 3`);
		expect(explain.rows[0].n).toBe(EXPLAIN_PROMPTS.length);
		const orphan = await db.query<{ c: string }>(
			`SELECT DISTINCT unnest(concepts) AS c FROM questions WHERE kind = 'explain' EXCEPT SELECT id FROM concepts`,
		);
		expect(orphan.rows).toEqual([]);
		// Fase 4: los conceptos derivados en SQL coinciden con los del cliente
		const derived = await db.query<{ category: string; subcategory: string | null; concepts: string[]; name: string; area: string }>(
			`SELECT q.category, q.subcategory, q.concepts, c.name, c.area FROM questions q JOIN concepts c ON c.id = q.concepts[1] WHERE q.kind = 'choice'`,
		);
		expect(derived.rows).toHaveLength(legacy.length);
		for (const r of derived.rows) {
			const [mine] = conceptsForQuestion({ category: r.category, subcategory: r.subcategory });
			expect(r.concepts).toEqual([mine.id]);
			expect({ name: r.name, area: r.area }).toEqual({ name: mine.name, area: mine.area });
		}
		for (const text of ["Árboles DOM & Eventos", "  CI/CD  ", "Ñandú Çà", "Docker y Kubernetes", "SQL avanzado", "Pruebas E2E"]) {
			const { rows: sl } = await db.query<{ s: string; a: string }>(`SELECT webwiz_slug($1) AS s, webwiz_area($1, 'frontend') AS a`, [text]);
			expect(sl[0]).toEqual({ s: slugify(text), a: areaFor(text, "frontend") });
		}
		const predict = await db.query<{ n: number }>(`SELECT count(*)::int AS n FROM questions WHERE kind = 'predict' AND option_meta IS NOT NULL`);
		expect(predict.rows[0].n).toBe(PREDICT_QUESTIONS.length);

		// Liga semanal: solo el grupo de quien consulta, ordenado por puntos
		const ids = ["00000000-0000-0000-0000-00000000000a", "00000000-0000-0000-0000-00000000000b", "00000000-0000-0000-0000-00000000000c"];
		for (const [i, id] of ids.entries()) {
			await db.exec(`INSERT INTO auth.users (id) VALUES ('${id}');`);
			await db.exec(`INSERT INTO resultados (name, "userId", score, total, category) VALUES ('U${i}', '${id}', ${3 + i}, 10, 'frontend');`);
		}
		await db.exec(`INSERT INTO user_experience (user_id, level) VALUES ('${ids[2]}', 'senior');`);
		await db.exec(`CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql AS $$ SELECT '${ids[0]}'::uuid $$;`);
		const league = await db.query<{ name: string; points: number; position: number; is_me: boolean; level: string }>(
			`SELECT name, points, "position", is_me, level FROM weekly_league()`,
		);
		expect(league.rows).toEqual([
			{ name: "U1", points: 4, position: 1, is_me: false, level: "junior" },
			{ name: "U0", points: 3, position: 2, is_me: true, level: "junior" },
		]);

		// Fase 5: solo los editores publican (RLS con el rol authenticated)
		await db.exec(`INSERT INTO user_roles (user_id, role) VALUES ('${ids[1]}', 'editor');`);
		await db.exec(`GRANT SELECT, INSERT ON challenges TO authenticated; GRANT SELECT ON user_roles TO authenticated;`);
		const publish = (author: string) =>
			db.exec(`SET ROLE authenticated; INSERT INTO challenges (id, title, instructions, category, type, spec, author_id) VALUES ('com-${author.slice(-1)}', 't', 'i', 'css', 'challenge', '{}', '${author}'); RESET ROLE;`);
		await expect(publish(ids[0])).rejects.toThrow(/row-level security/);
		await db.exec("RESET ROLE");
		await db.exec(`CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql AS $$ SELECT '${ids[1]}'::uuid $$;`);
		await publish(ids[1]);

		// Intento de incidencia con línea de tiempo y puntuación
		await db.exec(`INSERT INTO auth.users (id) VALUES ('00000000-0000-0000-0000-000000000001');`);
		await db.exec(`INSERT INTO challenge_attempts (user_id, challenge_id, code, results, passed, score, timeline)
			VALUES ('00000000-0000-0000-0000-000000000001', 'inc-482', '{}', '[]', true, 1450, '[{"t":0,"kind":"start","label":"Abrió el ticket"}]');`);
		await expect(
			db.exec(`INSERT INTO challenge_attempts (user_id, challenge_id, code, results, passed, score)
				VALUES ('00000000-0000-0000-0000-000000000001', 'inc-482', '{}', '[]', true, -5);`),
		).rejects.toThrow();
		await db.close();
	}, 60_000);

	it("el SQL de los retos está sincronizado con el catálogo (npm run db:challenges-seed)", () => {
		const committed = readFileSync(join(dir, "migrations/20261029_fase1_retos_seed.sql"), "utf8");
		expect(committed).toBe(challengesToSql(challengeCatalog));
		const incidents = readFileSync(join(dir, "migrations/20261030_fase3_incidencias_seed.sql"), "utf8");
		expect(incidents).toBe(incidentsToSql(INCIDENTS));
		const learning = readFileSync(join(dir, "migrations/20261031_fase4_aprendizaje_seed.sql"), "utf8");
		expect(learning).toBe(learningSeedSql(PREDICT_QUESTIONS));
		const phase5 = readFileSync(join(dir, "migrations/20261101_fase5_ia_temas_seed.sql"), "utf8");
		expect(phase5).toBe(phase5SeedSql(topicChallenges, REVIEWS, EXPLAIN_PROMPTS));
	});
});
