import { test, expect, type Page } from "@playwright/test";
import { PREDICT_QUESTIONS } from "../../src/content/questions/predict";

/**
 * Fase 4: confianza, repaso espaciado, resultados como diagnóstico y /hoy.
 * Supabase simulado: las preguntas son las de predicción del repo.
 */
const rows = PREDICT_QUESTIONS.slice(0, 3).map((q) => ({
	id: q.id,
	question: q.question,
	options: q.options,
	correctAnswer: q.correctAnswer,
	difficulty: q.difficulty,
	shortExplanation: q.shortExplanation,
	category: "frontend",
	subcategory: "JavaScript",
	concepts: q.concepts,
	kind: "predict",
	code: q.code,
	option_meta: q.optionMeta,
}));

async function login(page: Page) {
	await page.route("https://e2e.supabase.co/**", (r) => r.fulfill({ json: [] }));
	await page.route("https://e2e.supabase.co/rest/v1/questions*", (r) => r.fulfill({ json: rows }));
	const exp = Math.floor(Date.now() / 1000) + 30 * 86400;
	const session = JSON.stringify({
		access_token: "x.y.z",
		token_type: "bearer",
		expires_in: 3600,
		expires_at: exp,
		refresh_token: "r",
		user: { id: "u1", aud: "authenticated", email: "e2e@webwiz.dev", user_metadata: { full_name: "Ada Lovelace" }, app_metadata: {}, created_at: "" },
	});
	await page.addInitScript((s) => localStorage.setItem("sb-e2e-auth-token", s), session);
}

/** Responde la pregunta visible: la primera mal y con "Seguro", el resto bien. */
async function answer(page: Page, wrong: boolean) {
	const text = await page.locator("main").innerText();
	const q = rows.find((r) => text.includes(r.code.split("\n")[0].trim()));
	if (!q) throw new Error("Pregunta no reconocida");
	const target = wrong ? q.options.find((o) => o !== q.correctAnswer)! : q.correctAnswer;
	const options = page.locator("[role=radiogroup]").first().locator("[role=radio]");
	const idx = (await options.allInnerTexts()).findIndex((t) => t.includes(target));
	await options.nth(idx).click();
	await page.getByRole("radio", { name: "Seguro" }).click();
	await page.getByRole("button", { name: /Comprobar/ }).click();
}

test("confianza → diagnóstico → mapa → repaso al día siguiente", async ({ page }) => {
	test.setTimeout(90_000);
	await page.setViewportSize({ width: 1280, height: 900 });
	await login(page);

	// Usuario nuevo: /hoy propone el diagnóstico
	await page.goto("/");
	await expect(page).toHaveURL(/\/hoy$/);
	await expect(page.getByRole("heading", { level: 1, name: /, Ada$/ })).toBeVisible();
	await expect(page.getByText("Haz el diagnóstico inicial (3 min)")).toBeVisible();
	await expect(page.getByRole("heading", { name: "Nada que repasar hoy" })).toBeVisible();

	// Quiz con confianza
	await page.goto("/quiz/frontend?count=3");
	await expect(page.getByRole("radiogroup", { name: "¿Cuánta confianza tienes?" })).toBeVisible();
	await answer(page, true);
	await expect(page.getByText("Fallo con confianza alta")).toBeVisible();
	await expect(page.getByText("Por qué era tentadora:")).toBeVisible();
	await expect(page.getByText(/vuelve a tu repaso mañana/)).toBeVisible();
	await page.getByRole("button", { name: /Ejecutar/ }).click();
	await expect(page.getByLabel("Salida real")).toContainText("›");
	for (let i = 0; i < 2; i++) {
		await page.getByRole("button", { name: /Siguiente/ }).click();
		await answer(page, false);
	}
	await page.getByRole("button", { name: /Ver resultados/ }).click();

	// Resultados como diagnóstico: calibración y una sola acción
	await expect(page.getByText("Calibración", { exact: true })).toBeVisible();
	await expect(page.getByRole("img", { name: /^Seguro: 67% de aciertos/ })).toBeVisible();
	await expect(page.getByText(/fallaste 1 de las 3 que marcaste como «Seguro»/)).toBeVisible();
	await expect(page.getByText("Siguiente paso recomendado")).toBeVisible();
	await expect(page.getByRole("link", { name: "Empezar" })).toHaveCount(1);
	// Repaso del concepto más flojo o, si tiene pregunta abierta, "Explícalo tú"
	await expect(page.getByRole("link", { name: "Empezar" })).toHaveAttribute("href", /\/(repaso\?conceptos=|explica\/)/);

	// El mapa refleja el quiz
	await page.goto("/mapa");
	const map = page.locator("section[aria-labelledby=mapa-titulo]");
	await expect(map.getByRole("button", { name: /: A reforzar$/ }).first()).toBeVisible();
	await expect(map.getByRole("button", { name: /: En progreso$/ }).first()).toBeVisible();

	// Al día siguiente, el concepto fallado con "Seguro" está en el repaso
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	tomorrow.setHours(9, 0, 0, 0);
	await page.clock.setFixedTime(tomorrow);
	await page.goto("/hoy");
	const review = page.locator("section[aria-labelledby=repaso-hoy]");
	await expect(review).toContainText(/conceptos? (está|están) a punto de olvidarse/);
	await review.getByRole("link", { name: "Empezar repaso" }).click();
	await expect(page).toHaveURL(/\/repaso$/);
	await expect(page.getByText(/^Repaso · /)).toBeVisible();
});

test("diagnóstico inicial: fija el nivel y desaparece de /hoy", async ({ page }) => {
	test.setTimeout(60_000);
	await login(page);
	await page.goto("/diagnostico?count=3");
	await expect(page.getByText(/^Diagnóstico · /)).toBeVisible();
	for (let i = 0; i < 3; i++) {
		if (i > 0) await page.getByRole("button", { name: /Siguiente/ }).click();
		await answer(page, false);
	}
	await page.getByRole("button", { name: /Ver resultados/ }).click();
	await expect(page.getByText("DIAGNÓSTICO COMPLETADO")).toBeVisible();
	await expect(page.getByText(/Tu nivel de partida: Senior/)).toBeVisible();
	expect(await page.evaluate(() => localStorage.getItem("experienceLevel"))).toContain("senior");
	await page.goto("/hoy");
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	await expect(page.getByText("Haz el diagnóstico inicial (3 min)")).toHaveCount(0);
});
