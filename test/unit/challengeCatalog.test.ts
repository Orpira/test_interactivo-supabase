import { describe, it, expect } from "vitest";
import { challengeCatalog } from "../../src/content/challenges";

describe("catálogo de retos (Fase 1)", () => {
	it("tiene 10 retos por lenguaje repartidos en los tres niveles", () => {
		for (const cat of ["html", "css", "javascript"] as const) {
			const retos = challengeCatalog.filter((c) => c.category === cat);
			expect(retos).toHaveLength(10);
			for (const nivel of ["junior", "semi_senior", "senior"] as const) {
				expect(retos.some((c) => c.difficulty === nivel)).toBe(true);
			}
		}
	});

	it("ids únicos", () => {
		const ids = challengeCatalog.map((c) => c.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it.each(challengeCatalog.map((c) => [c.id, c] as const))(
		"%s: ≥3 tests con nombres únicos, 2 pistas y solución en archivos editables",
		(_id, c) => {
			expect(c.tests.length).toBeGreaterThanOrEqual(3);
			expect(new Set(c.tests.map((t) => t.name)).size).toBe(c.tests.length);
			expect(c.hints.length).toBeGreaterThanOrEqual(2);
			const solutionFiles = Object.keys(c.solution);
			expect(solutionFiles.length).toBeGreaterThan(0);
			for (const f of solutionFiles) expect(c.editable).toContain(f);
			expect(c.instructions.length).toBeGreaterThan(30);
			expect(c.concepts.length).toBeGreaterThan(0);
		},
	);
});
