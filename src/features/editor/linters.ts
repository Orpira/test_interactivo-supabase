import { parse } from "acorn";
import { translateAcorn } from "@/features/challenges/engine/loopProtect";

/** Diagnóstico independiente de CodeMirror (posiciones en el texto). */
export type LintIssue = { from: number; to: number; message: string; severity: "error" | "warning" };

// ------------------------------------------------------------ JavaScript

export function lintJs(code: string): LintIssue[] {
	if (!code.trim()) return [];
	try {
		parse(code, {
			ecmaVersion: "latest",
			sourceType: "script",
			allowReturnOutsideFunction: true,
			allowAwaitOutsideFunction: true,
		});
		return [];
	} catch (err) {
		const e = err as { pos?: number; message?: string };
		const pos = Math.min(e.pos ?? 0, Math.max(code.length - 1, 0));
		return [
			{
				from: pos,
				to: Math.min(pos + 1, code.length),
				severity: "error",
				message: `Error de sintaxis: ${translateAcorn((e.message ?? "").replace(/\s*\(\d+:\d+\)$/, ""))}`,
			},
		];
	}
}


// ------------------------------------------------------------------ CSS

export function lintCss(code: string): LintIssue[] {
	const issues: LintIssue[] = [];
	const stack: number[] = [];
	let i = 0;
	let stmtStart = 0;
	while (i < code.length) {
		const ch = code[i];
		if (ch === "/" && code[i + 1] === "*") {
			const end = code.indexOf("*/", i + 2);
			if (end === -1) {
				issues.push({ from: i, to: i + 2, severity: "error", message: "Comentario sin cerrar: falta «*/»." });
				return issues;
			}
			i = end + 2;
			continue;
		}
		if (ch === '"' || ch === "'") {
			const end = code.indexOf(ch, i + 1);
			const nl = code.indexOf("\n", i + 1);
			if (end === -1 || (nl !== -1 && nl < end)) {
				issues.push({ from: i, to: i + 1, severity: "error", message: "Cadena sin cerrar." });
				i = nl === -1 ? code.length : nl;
				continue;
			}
			i = end + 1;
			continue;
		}
		if (ch === "{") {
			stack.push(i);
			stmtStart = i + 1;
		} else if (ch === "}") {
			if (!stack.length) issues.push({ from: i, to: i + 1, severity: "error", message: "Llave «}» sin abrir." });
			else {
				checkDeclaration(code, stmtStart, i, issues);
				stack.pop();
			}
			stmtStart = i + 1;
		} else if (ch === ";") {
			if (stack.length) checkDeclaration(code, stmtStart, i, issues);
			stmtStart = i + 1;
		}
		i++;
	}
	for (const open of stack) {
		issues.push({ from: open, to: open + 1, severity: "error", message: "Falta cerrar la llave «}»." });
	}
	return issues;
}

/** Dentro de un bloque, «color red;» (sin dos puntos) es un error típico. */
function checkDeclaration(code: string, from: number, to: number, issues: LintIssue[]) {
	const text = code.slice(from, to);
	const trimmed = text.trim();
	if (!trimmed || trimmed.startsWith("@") || trimmed.includes("{")) return;
	if (!trimmed.includes(":")) {
		const start = from + text.indexOf(trimmed);
		issues.push({
			from: start,
			to: start + trimmed.length,
			severity: "error",
			message: `Declaración sin «:»: «${trimmed}». Formato: propiedad: valor;`,
		});
	}
}

// ----------------------------------------------------------------- HTML

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
// Etiquetas que el navegador cierra solas: no avisamos si falta su cierre
const OPTIONAL_CLOSE = new Set(["li", "p", "td", "th", "tr", "option", "thead", "tbody", "tfoot", "dt", "dd", "html", "head", "body", "colgroup"]);

export function lintHtml(code: string): LintIssue[] {
	const issues: LintIssue[] = [];
	const stack: { name: string; from: number; to: number }[] = [];
	const re = /<!--[\s\S]*?(-->|$)|<(\/?)([a-zA-Z][\w-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)(\/?)>|<(script|style)\b[^>]*>[\s\S]*?<\/\6>/g;
	for (const m of code.matchAll(re)) {
		const from = m.index ?? 0;
		const to = from + m[0].length;
		if (m[0].startsWith("<!--")) {
			if (!m[0].endsWith("-->")) issues.push({ from, to: from + 4, severity: "error", message: "Comentario sin cerrar: falta «-->»." });
			continue;
		}
		if (m[6]) continue; // bloque <script> / <style> completo
		const closing = m[2] === "/";
		const name = m[3].toLowerCase();
		const selfClosing = m[5] === "/";
		if (VOID.has(name) || selfClosing) {
			if (closing) issues.push({ from, to, severity: "warning", message: `<${name}> no lleva etiqueta de cierre.` });
			continue;
		}
		if (!closing) {
			stack.push({ name, from, to });
			continue;
		}
		const idx = stack.map((s) => s.name).lastIndexOf(name);
		if (idx === -1) {
			issues.push({ from, to, severity: "error", message: `Cierre </${name}> sin etiqueta de apertura.` });
			continue;
		}
		// Lo que quedó abierto entre medias no se cerró
		for (const open of stack.splice(idx).slice(1)) {
			if (!OPTIONAL_CLOSE.has(open.name)) {
				issues.push({ from: open.from, to: open.to, severity: "error", message: `<${open.name}> no está cerrada antes de </${name}>.` });
			}
		}
	}
	for (const open of stack) {
		if (!OPTIONAL_CLOSE.has(open.name)) {
			issues.push({ from: open.from, to: open.to, severity: "error", message: `Falta cerrar <${open.name}>.` });
		}
	}
	return issues;
}
