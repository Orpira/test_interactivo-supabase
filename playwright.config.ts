import { defineConfig, devices } from "@playwright/test";

// Pruebas E2E. Usan valores ficticios de Supabase: no tocan datos reales.
export default defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: false,
	webServer: {
		command: "npm run dev -- --port 5173 --strictPort",
		port: 5173,
		timeout: 60 * 1000,
		reuseExistingServer: !process.env.CI,
		env: {
			VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? "https://e2e.supabase.co",
			VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ?? "e2e-anon-key",
			VITE_TURNSTILE_SITE_KEY: "",
		},
	},
	use: {
		baseURL: "http://localhost:5173",
		trace: "on-first-retry",
		headless: true,
		viewport: { width: 1280, height: 720 },
		// Opcional: usar un Chromium ya instalado (PW_CHROMIUM=/ruta/a/chrome)
		...(process.env.PW_CHROMIUM ? { launchOptions: { executablePath: process.env.PW_CHROMIUM } } : {}),
	},
	// Chromium por defecto; Firefox y WebKit con --project (requieren `npx playwright install`)
	projects: [
		{ name: "chromium", use: { ...devices["Desktop Chrome"] } },
		{ name: "firefox", use: { ...devices["Desktop Firefox"] } },
		{ name: "webkit", use: { ...devices["Desktop Safari"] } },
	],
	reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
});
