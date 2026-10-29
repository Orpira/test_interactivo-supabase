// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { challengeCatalog } from "../../src/content/challenges";
import { challengesToSql, incidentsToSql } from "../../src/content/challenges/toSql";
import { INCIDENTS } from "../../src/content/incidents";

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
		const files = readdirSync(join(dir, "migrations")).sort();
		for (let pass = 0; pass < 2; pass++) {
			for (const f of files) await db.exec(readFileSync(join(dir, "migrations", f), "utf8"));
		}
		const { rows } = await db.query<{ visibles: number; legacy: number }>(
			`SELECT count(*) FILTER (WHERE NOT legacy)::int AS visibles,
			        count(*) FILTER (WHERE legacy)::int AS legacy FROM challenges`,
		);
		expect(rows[0]).toEqual({ visibles: challengeCatalog.length + INCIDENTS.length, legacy: 1 });
		const types = await db.query<{ type: string; n: number }>(
			`SELECT type, count(*)::int AS n FROM challenges WHERE NOT legacy GROUP BY type ORDER BY type`,
		);
		expect(types.rows).toEqual([
			{ type: "challenge", n: challengeCatalog.length },
			{ type: "incident", n: INCIDENTS.length },
		]);
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
	});
});
