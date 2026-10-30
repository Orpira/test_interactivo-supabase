import { test, expect, type Page } from "@playwright/test";

/** Portada para visitantes sin cuenta. */
async function guest(page: Page) {
	await page.route("https://e2e.supabase.co/**", (r) =>
		r.request().method() === "HEAD"
			? r.fulfill({ status: 200, headers: { "content-range": "*/437", "access-control-allow-origin": "*", "access-control-expose-headers": "content-range" }, body: "" })
			: r.fulfill({ json: [] }),
	);
	await page.goto("/");
}

test("la portada explica lo que hace la app y sus cifras", async ({ page }) => {
	await guest(page);
	await expect(page.getByRole("heading", { level: 1 })).toContainText("Entrena el trabajo de un dev");
	await expect(page.getByText("400+")).toBeVisible();
	for (const h of ["Modo Incidencia", "Retos con IDE y tests en vivo", "Revisa el código de la IA", "Laboratorios de SQL y Git", "Explícalo tú"]) {
		await expect(page.getByRole("heading", { name: h })).toBeVisible();
	}
	// Ningún enlace a zonas que requieren cuenta
	await expect(page.getByRole("link", { name: /editor/i })).toHaveCount(0);
});

test("pregunta de muestra jugable sin cuenta", async ({ page }) => {
	await guest(page);
	const comprobar = page.getByRole("button", { name: "Comprobar" });
	await expect(comprobar).toBeDisabled();
	await page.getByRole("radio", { name: /A, B, C, D/ }).click();
	await page.getByRole("radio", { name: "Seguro" }).click();
	await comprobar.click();
	await expect(page.getByText("Fallo con confianza alta", { exact: true })).toBeVisible();
	await expect(page.getByText("Por qué era tentadora:")).toBeVisible();

	await page.getByRole("button", { name: "Ejecutar el código" }).click();
	await expect(page.getByText(/^A\s*D\s*C\s*B$|A[\s\S]{0,40}D[\s\S]{0,40}C[\s\S]{0,40}B/).last()).toBeVisible();

	await page.getByRole("button", { name: /crea tu cuenta gratis/i }).click();
	await expect(page.getByRole("dialog")).toBeVisible();
});

test("las categorías del quiz llevan al selector de nivel", async ({ page }) => {
	await guest(page);
	await page.getByRole("link", { name: "Hacer un quiz sin registrarme" }).click();
	await page.getByRole("button", { name: /Frontend/ }).click();
	await expect(page).toHaveURL(/quizCategory=frontend/);
	await expect(page.getByRole("heading", { name: "Selecciona tu nivel" })).toBeVisible();
});

test("«Crear cuenta gratis» abre el acceso", async ({ page }) => {
	await guest(page);
	await page.getByRole("button", { name: "Crear cuenta gratis" }).first().click();
	await expect(page.getByRole("dialog", { name: /.+/ })).toBeVisible();
});

test("«Volver arriba» aparece al hacer scroll y sube al inicio", async ({ page }) => {
	await guest(page);
	const btn = page.getByRole("button", { name: "Volver arriba" });
	await expect(btn).toBeHidden();
	await page.mouse.wheel(0, 3000);
	await expect(btn).toBeVisible();
	await btn.click();
	await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
	await expect(btn).toBeHidden();
});
