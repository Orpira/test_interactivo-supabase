import { normalizeLang } from "@/services/highlighter";

export const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

export type RichSegment =
	| { type: "text"; text: string }
	| { type: "code"; code: string; lang: string | null };

const FENCE = /```([\w+-]*)\n?([\s\S]*?)```/g;

// Línea que "parece código": útil para preguntas antiguas sin bloques ```
const CODE_LINE =
	/^\s*(<\/?[a-zA-Z][^>]*>|[.#]?[\w-]+\s*\{|\}|(const|let|var|function|return|if|for|while|class|import|export|console\.|SELECT|INSERT|UPDATE|DELETE|CREATE|FROM|WHERE|docker|kubectl|git|npm|sudo|cd|ls|chmod|chown|apt|echo)\b|.*[;{}]\s*$|.*=>)/;

/** Lenguaje por defecto según la categoría/subcategoría del quiz. */
export function langFromTopic(...topics: (string | undefined)[]): string | null {
	const t = topics.filter(Boolean).join(" ").toLowerCase();
	if (/typescript|\bts\b/.test(t)) return "typescript";
	if (/react|jsx/.test(t)) return "jsx";
	if (/javascript|\bjs\b|node|express|frontend/.test(t)) return "javascript";
	if (/\bhtml\b/.test(t)) return "html";
	if (/\bcss\b|tailwind|sass/.test(t)) return "css";
	if (/sql|postgres|mysql|base de datos|database|supabase/.test(t)) return "sql";
	if (/docker/.test(t)) return "dockerfile";
	if (/linux|bash|shell|terminal|devops|git/.test(t)) return "bash";
	if (/python/.test(t)) return "python";
	if (/yaml|kubernetes|k8s|ci\/cd|github actions/.test(t)) return "yaml";
	return null;
}

/** Divide un texto en párrafos y bloques de código. */
export function parseRich(text: string, defaultLang: string | null): RichSegment[] {
	const segments: RichSegment[] = [];
	let last = 0;
	let hadFence = false;
	for (const m of text.matchAll(FENCE)) {
		hadFence = true;
		const before = text.slice(last, m.index);
		if (before.trim()) segments.push({ type: "text", text: before.trim() });
		segments.push({
			type: "code",
			code: m[2].replace(/\n$/, ""),
			lang: normalizeLang(m[1]) ?? defaultLang,
		});
		last = (m.index ?? 0) + m[0].length;
	}
	const rest = text.slice(last);
	if (rest.trim()) segments.push({ type: "text", text: rest.trim() });
	if (hadFence) return segments;

	// Sin bloques ```: si hay varias líneas y el final parece código, se separa.
	const lines = text.split("\n");
	if (lines.length > 1) {
		const firstCode = lines.findIndex((l, i) => i > 0 && CODE_LINE.test(l));
		if (firstCode > 0) {
			const prose = lines.slice(0, firstCode).join("\n").trim();
			const code = lines.slice(firstCode).join("\n").replace(/\s+$/, "");
			return [
				...(prose ? [{ type: "text" as const, text: prose }] : []),
				{ type: "code", code, lang: defaultLang },
			];
		}
		if (lines.every((l) => !l.trim() || CODE_LINE.test(l))) {
			return [{ type: "code", code: text.trim(), lang: defaultLang }];
		}
	}
	return segments;
}

/** ¿Es una opción de respuesta que contiene código? (se muestra en monoespaciada) */
export function looksLikeCode(option: string): boolean {
	const o = option.trim();
	if (/^`[^`]+`$/.test(o)) return true;
	if (/^<\/?[a-zA-Z][\s\S]*>$/.test(o)) return true;
	const words = o.split(/\s+/).length;
	if (words > 6) return false;
	return /=>|===|!==|[{};]|\w\(.*\)|^\.[\w-]+|^#[\w-]+|^[\w-]+:\s*[\w#-]+;?$|^\$|^--?[a-z]|^(npm|git|docker|sudo|ls|cd|chmod|SELECT|CREATE)\b|\w+\.\w+/.test(
		o,
	);
}

export function stripBackticks(option: string) {
	const o = option.trim();
	return /^`[^`]+`$/.test(o) ? o.slice(1, -1) : option;
}
