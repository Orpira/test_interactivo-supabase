import { test, expect } from "@playwright/test";

/**
 * Verifica los 30 retos en un navegador real (los tests "dom" necesitan
 * maquetación): la solución pasa todos los tests y el código inicial falla
 * al menos uno.
 */
test("los retos se verifican: solución pasa, código inicial falla", async ({ page }) => {
	test.setTimeout(240_000);
	await page.goto("/");

	const report = await page.evaluate(async () => {
		const { challengeCatalog } = await import("/src/content/challenges/index.ts");
		const { runChallengeTests } = await import("/src/features/challenges/engine/runner.ts");
		const out: { id: string; starterFails: boolean; solutionPasses: boolean; detail: string }[] = [];
		for (const c of challengeCatalog) {
			const starter = await runChallengeTests(c.files, c.tests);
			const solved = await runChallengeTests({ ...c.files, ...c.solution }, c.tests);
			out.push({
				id: c.id,
				starterFails: starter.some((r) => !r.passed),
				solutionPasses: solved.every((r) => r.passed),
				detail: solved
					.filter((r) => !r.passed)
					.map((r) => `${r.name}: ${r.message}`)
					.join(" | "),
			});
		}
		return out;
	});

	const broken = report.filter((r) => !r.starterFails || !r.solutionPasses);
	expect(report).toHaveLength(30);
	expect(broken, JSON.stringify(broken, null, 2)).toEqual([]);
});
