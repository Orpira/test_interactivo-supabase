import { test, expect, type Page } from "@playwright/test";

/**
 * Modo Incidencia (Fase 3).
 *  1. Las 10 incidencias: el código con el fallo no pasa la aceptación pero sí
 *     la regresión; la solución de referencia pasa ambas.
 *  2. Flujo completo en la interfaz: diagnóstico, envío fallido, arreglo y cierre.
 */
test("las incidencias se verifican: fallo reproducible, solución sin regresiones", async ({ page }) => {
	test.setTimeout(240_000);
	await page.goto("/");
	const report = await page.evaluate(async () => {
		const { INCIDENTS } = await import("/src/content/incidents/index.ts");
		const { runChallengeTests } = await import("/src/features/challenges/engine/runner.ts");
		const out: { id: string; ok: boolean; detail: string }[] = [];
		for (const c of INCIDENTS) {
			const opts = { width: c.viewport, height: 800, network: c.networkLog };
			const sol = { ...c.files, ...c.solution };
			const [sA, sR, oA, oR] = [
				await runChallengeTests(c.files, c.tests, opts),
				await runChallengeTests(c.files, c.regressionTests, opts),
				await runChallengeTests(sol, c.tests, opts),
				await runChallengeTests(sol, c.regressionTests, opts),
			];
			const fails = (rs: { passed: boolean; name: string; message: string }[]) =>
				rs.filter((r) => !r.passed).map((r) => `${r.name}: ${r.message}`);
			out.push({
				id: c.id,
				ok: sA.some((r) => !r.passed) && sR.every((r) => r.passed) && oA.every((r) => r.passed) && oR.every((r) => r.passed),
				detail: JSON.stringify({ starterReg: fails(sR), solAcc: fails(oA), solReg: fails(oR) }),
			});
		}
		return out;
	});
	expect(report).toHaveLength(10);
	expect(report.filter((r) => !r.ok)).toEqual([]);
});

const SOLVED_CSS = `body { margin: 0; padding: 24px; font-family: system-ui, sans-serif; }
.metricas { display: flex; flex-wrap: wrap; }
.metrica {
  box-sizing: border-box;
  width: 33.333%;
  padding: 24px;
  border: 1px solid #d0d7de;
  border-radius: 12px;
}
.metrica strong { display: block; font-size: 2rem; }`;

async function login(page: Page) {
	await page.route("https://e2e.supabase.co/**", (r) => r.fulfill({ json: [] }));
	const exp = Math.floor(Date.now() / 1000) + 3600;
	const session = JSON.stringify({
		access_token: "x.y.z",
		token_type: "bearer",
		expires_in: 3600,
		expires_at: exp,
		refresh_token: "r",
		user: { id: "u1", aud: "authenticated", email: "e2e@webwiz.dev", user_metadata: {}, app_metadata: {}, created_at: "" },
	});
	await page.addInitScript((s) => localStorage.setItem("sb-e2e-auth-token", s), session);
}

test("flujo de una incidencia: diagnóstico, envío fallido y cierre del ticket", async ({ page }) => {
	test.setTimeout(90_000);
	await page.setViewportSize({ width: 1440, height: 900 });
	await login(page);

	// Lista
	await page.goto("/incidencias");
	await expect(page.getByRole("heading", { name: "Arregla bugs de verdad" })).toBeVisible();
	await expect(page.locator("main li")).toHaveCount(10);

	// Ticket #482: la consola y la red delatan el fallo
	await page.goto("/incidencias/inc-482");
	await expect(page.getByText(/Aceptación \(ocultos\) 0\/3/)).toBeVisible({ timeout: 15_000 });
	await expect(page.locator("section[aria-label=Consola]")).toContainText("app.js, línea 10");
	await page.getByRole("tab", { name: /^Red/ }).click();
	await expect(page.getByText("Ninguna petición a /api/pay (POST)")).toBeVisible();
	await page.getByRole("tab", { name: /^Elementos/ }).click();
	await page.locator("section[aria-label=Elementos] button", { hasText: 'id="menu"' }).first().click();
	await expect(page.locator("section[aria-label=Elementos] dl")).toContainText("opacity (sospechosa)");

	// Envío con el fallo: el ticket sigue abierto
	await page.getByRole("button", { name: /Enviar arreglo/ }).click();
	await expect(page.getByRole("status").filter({ hasText: "sigue abierto" })).toBeVisible();

	// Ticket #128 con el arreglo: se cierra
	await page.addInitScript((css) => {
		localStorage.setItem("webwiz-draft:inc-128", JSON.stringify({ files: { "styles.css": css }, hints: 0, savedAt: 1 }));
	}, SOLVED_CSS);
	await page.goto("/incidencias/inc-128");
	await expect(page.getByText(/Aceptación \(ocultos\) 2\/2/)).toBeVisible({ timeout: 15_000 });
	await expect(page.getByText(/Regresión 3\/3/)).toBeVisible();
	await page.getByRole("button", { name: /Enviar arreglo/ }).click();
	const modal = page.getByRole("dialog");
	await expect(modal.getByRole("heading", { name: "TICKET #128 CERRADO" })).toBeVisible();
	await expect(modal).toContainText("Causa raíz");
	await expect(modal).toContainText("Ticket cerrado");
	await modal.getByRole("button", { name: /Siguiente incidencia/ }).click();
	await expect(page).toHaveURL(/\/incidencias\/inc-611$/);
});
