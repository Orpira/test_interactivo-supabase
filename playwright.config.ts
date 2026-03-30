import { defineConfig, devices } from "@playwright/test";

// Configuración de Playwright para pruebas E2E
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,

  // ---------- Arranca tu dev-server de Vite antes de las pruebas ----------

  webServer: {
    command: "npm run dev",
    port: 5173,
    timeout: 30 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    headless: true,
    viewport: { width: 1280, height: 720 },
  },

  // ---------- Targets (Chromium, Firefox, WebKit, Mobile, etc.) ----------

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],

  // ---------- Configuración de cobertura de código ----------

  reporter: [
    ["html", { open: "never" }],
    ["list"],
    [
      "@bgotink/playwright-coverage",
      {
        outputDir: "coverage/e2e-report",
      },
    ],
    ["json", { outputFile: "test-results.json" }],
    ["junit", { outputFile: "test-results.xml" }],
    [
      "playwright-coverage",
      {
        outputFile: "coverage.json",
        include: ["src/**/*.{js,ts,jsx,tsx}"],
        requireEnv: true,
        extension: [".js", ".ts", ".jsx", ".tsx"],
      },
    ],
  ],
});
