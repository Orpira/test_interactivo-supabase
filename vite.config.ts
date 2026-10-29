import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import istanbul from "vite-plugin-istanbul";

export default defineConfig({
	plugins: [
		react(),
		istanbul({
			include: ["src/**/*.{js,ts,jsx,tsx}"],
			requireEnv: true,
			extension: [".js", ".ts", ".jsx", ".tsx"],
		}),
	],
	// PGlite (laboratorio SQL) carga su .wasm y sus datos con import.meta.url: sin pre-empaquetar
	optimizeDeps: {
		exclude: ["@electric-sql/pglite"],
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: "./setupTests.ts",
		// Valores ficticios: los tests nunca deben tocar el Supabase real
		env: {
			VITE_SUPABASE_URL: "http://localhost:54321",
			VITE_SUPABASE_ANON_KEY: "test-anon-key",
		},
		exclude: [
			// Patrones de exclusión por defecto de Vitest (puedes mantenerlos o revisarlos)
			"**/node_modules/**",
			"**/dist/**",
			"**/cypress/**",
			"**/.{idea,git,cache,output,temp}/**",
			"**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,eslint,prettier}.config.*",
			// Añade esta línea para excluir tus tests E2E de Playwright
			"**/tests/e2e/**",
		],
	},
});
