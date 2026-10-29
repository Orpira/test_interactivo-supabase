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

let highlighterPromise: Promise<HighlighterCore> | null = null;

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
			langs: [
				import("@shikijs/langs/javascript"),
				import("@shikijs/langs/typescript"),
				import("@shikijs/langs/jsx"),
				import("@shikijs/langs/tsx"),
				import("@shikijs/langs/html"),
				import("@shikijs/langs/css"),
				import("@shikijs/langs/json"),
				import("@shikijs/langs/sql"),
				import("@shikijs/langs/bash"),
				import("@shikijs/langs/yaml"),
				import("@shikijs/langs/dockerfile"),
				import("@shikijs/langs/python"),
			],
		});
	})();
	return highlighterPromise;
}

export function normalizeLang(lang?: string | null): string | null {
	if (!lang) return null;
	return LANG_ALIASES[lang.toLowerCase()] ?? null;
}

/** HTML resaltado (Shiki escapa el código). Tema claro/oscuro vía variables CSS. */
export async function highlight(code: string, lang: string): Promise<string> {
	const highlighter = await getHighlighter();
	return highlighter.codeToHtml(code, {
		lang,
		themes: { light: "github-light", dark: "github-dark-default" },
		defaultColor: false,
	});
}
