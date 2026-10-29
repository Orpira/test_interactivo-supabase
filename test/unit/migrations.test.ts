// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { challengeCatalog } from "../../src/content/challenges";
import { challengesToSql } from "../../src/content/challenges/toSql";

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
		expect(rows[0]).toEqual({ visibles: challengeCatalog.length, legacy: 1 });
		await db.close();
	}, 60_000);

	it("el SQL de los retos está sincronizado con el catálogo (npm run db:challenges-seed)", () => {
		const committed = readFileSync(join(dir, "migrations/20261029_fase1_retos_seed.sql"), "utf8");
		expect(committed).toBe(challengesToSql(challengeCatalog));
	});
});
