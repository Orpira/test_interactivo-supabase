import type { HighlighterCore } from "shiki/core";

/**
 * Resaltado de sintaxis con Shiki, cargado bajo demanda (no pesa en la carga
 * inicial). Motor de expresiones regulares en JavaScript: sin WASM, funciona
 * igual en web y en el WebView de Android.
 */
const LANG_ALIASES: Record<string, string> = {
	js: "javascript",
	javascript: "javascript",
	ts: "typescript",
	typescript: "typescript",
	jsx: "jsx",
	tsx: "tsx",
	html: "html",
	css: "css",
	json: "json",
	sql: "sql",
	bash: "bash",
	sh: "bash",
	shell: "bash",
	yaml: "yaml",
	yml: "yaml",
	dockerfile: "dockerfile",
	docker: "dockerfile",
	python: "python",
	py: "python",
};

// Cada gramática se descarga solo cuando aparece código en ese lenguaje
const LANG_LOADERS: Record<string, () => Promise<unknown>> = {
	javascript: () => import("@shikijs/langs/javascript"),
	typescript: () => import("@shikijs/langs/typescript"),
	jsx: () => import("@shikijs/langs/jsx"),
	tsx: () => import("@shikijs/langs/tsx"),
	html: () => import("@shikijs/langs/html"),
	css: () => import("@shikijs/langs/css"),
	json: () => import("@shikijs/langs/json"),
	sql: () => import("@shikijs/langs/sql"),
	bash: () => import("@shikijs/langs/bash"),
	yaml: () => import("@shikijs/langs/yaml"),
	dockerfile: () => import("@shikijs/langs/dockerfile"),
	python: () => import("@shikijs/langs/python"),
};

let highlighterPromise: Promise<HighlighterCore> | null = null;
const langPromises = new Map<string, Promise<void>>();

function getHighlighter() {
	highlighterPromise ??= (async () => {
		const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] =
			await Promise.all([
				import("shiki/core"),
				import("shiki/engine/javascript"),
			]);
		return createHighlighterCore({
			engine: createJavaScriptRegexEngine(),
			themes: [
				import("@shikijs/themes/github-light"),
				import("@shikijs/themes/github-dark-default"),
			],
			langs: [],
		});
	})();
	return highlighterPromise;
}

async function ensureLang(highlighter: HighlighterCore, lang: string) {
	if (!langPromises.has(lang)) {
		const loader = LANG_LOADERS[lang];
		if (!loader) throw new Error(`Lenguaje no soportado: ${lang}`);
		langPromises.set(
			lang,
			loader().then((mod) =>
				highlighter.loadLanguage(
					(mod as { default: Parameters<HighlighterCore["loadLanguage"]>[0] }).default,
				),
			),
		);
	}
	await langPromises.get(lang);
}

export function normalizeLang(lang?: string | null): string | null {
	if (!lang) return null;
	return LANG_ALIASES[lang.toLowerCase()] ?? null;
}

/** HTML resaltado (Shiki escapa el código). Tema claro/oscuro vía variables CSS. */
export async function highlight(code: string, lang: string): Promise<string> {
	const highlighter = await getHighlighter();
	await ensureLang(highlighter, lang);
	return highlighter.codeToHtml(code, {
		lang,
		themes: { light: "github-light", dark: "github-dark-default" },
		defaultColor: false,
	});
}
