// @vitest-environment node
import { describe, it, expect } from "vitest";
import { SQL_EXERCISES } from "../../src/content/topics/sql";
import { checkExercise, runSql, sameResult } from "../../src/features/sql/engine";

describe("laboratorio SQL (PGlite)", () => {
	it("10 ejercicios", () => expect(SQL_EXERCISES).toHaveLength(10));

	it.each(SQL_EXERCISES.map((e) => [e.id, e] as const))("%s: la solución pasa y el código inicial no", async (_, ex) => {
		const good = await checkExercise(ex, ex.solution);
		expect(good.passed).toBe(true);
		expect(good.expected?.rows.length).toBeGreaterThan(0);
		const bad = await checkExercise(ex, ex.starter);
		expect(bad.passed).toBe(false);
	}, 30_000);

	it("errores traducidos y comparación sin orden", async () => {
		const r = await runSql("SELECT nombre FROM clientess");
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.error).toMatch(/La tabla "clientess" no existe/);
		const a = { columns: ["x"], rows: [[1], [2]] };
		const b = { columns: ["y"], rows: [["2"], ["1"]] };
		expect(sameResult(a, b, false)).toBe(true);
		expect(sameResult(a, b, true)).toBe(false);
	});
});

describe("aislamiento", () => {
	it("cada ejecución se deshace y no admite transacciones propias", async () => {
		await runSql("UPDATE productos SET precio = 0");
		const r = await runSql("SELECT count(*)::int AS n FROM productos WHERE precio = 0");
		expect(r.ok && r.result?.rows[0][0]).toBe(0);
		const t = await runSql("COMMIT; DELETE FROM lineas");
		expect(t.ok).toBe(false);
	});
});
