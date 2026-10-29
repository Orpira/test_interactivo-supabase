import { test, expect, type Page } from "@playwright/test";

/** Fase 5: revisión de código de IA, Explícalo tú, laboratorios SQL y Git, /crear. */
async function login(page: Page, opts: { editor?: boolean; explain?: "ok" | "error" } = {}) {
	await page.route("https://e2e.supabase.co/**", (r) => r.fulfill({ json: [] }));
	await page.route("https://e2e.supabase.co/rest/v1/rpc/is_content_editor*", (r) => r.fulfill({ json: !!opts.editor }));
	await page.route("https://e2e.supabase.co/functions/v1/explain-review", (r) =>
		opts.explain === "error"
			? r.fulfill({ status: 429, json: { error: "Has usado tus 10 correcciones de hoy. Vuelve mañana." } })
			: r.fulfill({
					json: {
						cached: false,
						review: {
							score: 1,
							covered: ["var tiene ámbito de función: las tres funciones comparten la misma variable i"],
							missing: [
								"los callbacks de setTimeout se ejecutan después de que el bucle termine, cuando i ya vale 3",
								"con let se crea una variable nueva por iteración (o se captura el valor con una función/IIFE)",
							],
							misconception: "timeout-cero",
							feedback: "Bien lo de var, pero setTimeout no se ejecuta dentro de la iteración.",
						},
					},
				}),
	);
	const exp = Math.floor(Date.now() / 1000) + 30 * 86400;
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

test("revisión de código de IA: acierto, falso positivo y revelado", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await login(page);
	await page.goto("/revisiones");
	await expect(page.locator("main li")).toHaveCount(8);
	await page.goto("/revisiones/rev-04");
	// Fallo real: la contraseña en consola (seguridad)
	const row = await page.locator("tr", { hasText: 'console.log("login", email, password);' }).locator("button").getAttribute("aria-label");
	await page.getByRole("button", { name: row! }).click();
	await page.getByRole("radio", { name: "Seguridad" }).click();
	await page.getByLabel("Explica el problema").fill("Registra la contraseña");
	await page.getByRole("button", { name: "Añadir comentario" }).click();
	// Falso positivo
	await page.getByRole("button", { name: "Comentar la línea 10", exact: true }).click();
	await page.getByRole("button", { name: "Añadir comentario" }).click();
	await page.getByRole("button", { name: "Enviar revisión" }).click();
	await expect(page.getByRole("heading", { name: /Encontraste 1 de 3 fallos · 75\/300 puntos/ })).toBeVisible();
	await expect(page.getByText("Falso positivo")).toBeVisible();
	await expect(page.getByText("Se te escapó")).toHaveCount(2);
});

test("Explícalo tú: corrección, concepto erróneo y error amable", async ({ page }) => {
	await login(page);
	await page.goto("/explica/7c2e0b20-0000-4000-8000-000000000001");
	const btn = page.getByRole("button", { name: "Corregir con Claude" });
	await expect(btn).toBeDisabled();
	await page.getByLabel("Tu explicación").fill("Porque var es de función y setTimeout se ejecuta en cada vuelta.");
	await btn.click();
	await expect(page.getByRole("heading", { name: "1/3 puntos clave" })).toBeVisible();
	await expect(page.getByText(/Concepto erróneo detectado/)).toBeVisible();
	await expect(page.getByText(/Closures vuelve a tu repaso mañana/)).toBeVisible();

	const p2 = await page.context().newPage();
	await login(p2, { explain: "error" });
	await p2.goto("/explica/7c2e0b20-0000-4000-8000-000000000002");
	await p2.getByLabel("Tu explicación").fill("Primero lo síncrono, después las microtareas y al final setTimeout.");
	await p2.getByRole("button", { name: "Corregir con Claude" }).click();
	await expect(p2.getByRole("alert")).toContainText("Has usado tus 10 correcciones de hoy");
});

test("laboratorio SQL con PGlite", async ({ page }) => {
	test.setTimeout(60_000);
	await login(page);
	await page.goto("/sql/sql-05");
	await page.getByRole("button", { name: /Ejecutar y comprobar/ }).click();
	await expect(page.getByText(/El resultado no coincide/)).toBeVisible({ timeout: 30_000 });
	await page.locator(".cm-content").click();
	await page.keyboard.press("Control+a");
	await page.keyboard.type("SELECT c.nombre FROM clientes c WHERE NOT EXISTS (SELECT 1 FROM pedidos p WHERE p.cliente_id = c.id);");
	await page.getByRole("button", { name: /Ejecutar y comprobar/ }).click();
	await expect(page.getByText("¡Correcto! El resultado coincide con el esperado.")).toBeVisible({ timeout: 30_000 });
	await expect(page.getByRole("region", { name: "Tu resultado" })).toContainText("Leire");
});

test("Git en escenarios: terminal y comprobación", async ({ page }) => {
	await login(page);
	await page.goto("/git/git-01");
	const term = page.getByLabel(/comando/);
	await expect(page.getByText(/Aún no:/)).toBeVisible();
	for (const cmd of ["git log --oneline --all", "git branch carrito", "git reset --hard HEAD~1", "git switch carrito"]) {
		await term.fill(cmd);
		await term.press("Enter");
	}
	await expect(page.getByRole("log")).toContainText("Cambiado a rama 'carrito'");
	await expect(page.getByText("¡Resuelto!")).toBeVisible();
});

test("/crear: solo editores, y valida antes de publicar", async ({ page }) => {
	test.setTimeout(60_000);
	await login(page);
	await page.goto("/crear");
	await expect(page.getByRole("heading", { name: "Solo para editores" })).toBeVisible();

	const p2 = await page.context().newPage();
	await login(p2, { editor: true });
	await p2.goto("/crear");
	await expect(p2.getByRole("heading", { name: "Nuevo reto" })).toBeVisible();
	await expect(p2.getByRole("button", { name: "Publicar" })).toBeDisabled();
	await p2.getByRole("button", { name: "Validar" }).click();
	await expect(p2.getByText("La solución pasa todos los tests")).toBeVisible({ timeout: 20_000 });
	await expect(p2.getByRole("button", { name: "Publicar" })).toBeEnabled();
});
