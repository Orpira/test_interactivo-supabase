import { test, expect } from "@playwright/test";

test("la página de inicio muestra el título", async ({ page }) => {
	await page.goto("/");
	// Usa getByRole para evitar ambigüedad
	await expect(
		page.getByRole("heading", { name: /WebWiz Quiz/i }),
	).toBeVisible();
});

test("Home público no muestra enlace a Retos", async ({ page }) => {
	await page.goto("/");
	const editorLink = page.getByRole("link", { name: /editor/i });
	await expect(editorLink).toHaveCount(0); // ✅ debería ser 0
});

test("La página de inicio tiene un boton a los quizzes", async ({ page }) => {
	await page.goto("/");

	// Boton que dice exactamente ¡Empieza ahora! (ignora mayúsculas/minúsculas)
	const quizzesButton = page.getByRole("button", { name: /¡Empieza ahora!/i });
	await expect(quizzesButton).toBeVisible();

	await quizzesButton.click();
	await expect(page).toHaveURL(/\/quiz/);
});

test("la página de inicio tiene un enlace a contactenos", async ({ page }) => {
	await page.goto("/");
	// Verifica que el enlace a contactenos esté presente
	const contactLink = page.getByRole("link", { name: /contactenos/i });
	await expect(contactLink).toBeVisible();
	// Verifica que el enlace apunte a la ruta correcta
	await expect(contactLink).toHaveAttribute("href", "/contacto");
});

test("la página de inicio tiene un boton a Iniciar sesión", async ({
	page,
}) => {
	await page.goto("/");
	// Verifica que el botón a Iniciar sesión esté presente
	const loginBtn = page.getByRole("button", { name: /Iniciar sesión/i });
	await expect(loginBtn).toBeVisible();

	await Promise.all([
		page.waitForNavigation(), // espera la navegación real
		loginBtn.click(),
	]);

	await expect(page).toHaveURL(
		/ptfarbvcspjtxsugbuer\.supabase\.co/i, // dominio Supabase Auth
	);
});
