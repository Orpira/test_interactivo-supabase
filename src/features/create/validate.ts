import { FILE_NAMES, type ChallengeSpec, type ChallengeTest } from "@/features/challenges/engine/types";
import type { IncidentSpec } from "@/features/incidents/types";

export type Draft = ({ kind: "challenge" } & ChallengeSpec) | ({ kind: "incident" } & IncidentSpec);

const LEVELS = ["junior", "semi_senior", "senior"];
const CATEGORIES = ["html", "css", "javascript", "accesibilidad", "seguridad", "rendimiento"];

function checkTests(tests: unknown, label: string, errors: string[]) {
	if (!Array.isArray(tests) || tests.length === 0) {
		errors.push(`${label}: hace falta al menos un test`);
		return;
	}
	const names = new Set<string>();
	(tests as ChallengeTest[]).forEach((t, i) => {
		if (!t || typeof t.name !== "string" || !t.name.trim()) errors.push(`${label}[${i}]: falta "name"`);
		else if (names.has(t.name)) errors.push(`${label}: nombre repetido «${t.name}»`);
		else names.add(t.name);
		if (!["dom", "js", "console"].includes(t?.type)) errors.push(`${label}[${i}]: "type" debe ser dom, js o console`);
		if (t?.type === "console" ? typeof (t as { expected?: unknown }).expected !== "string" : typeof (t as { code?: unknown })?.code !== "string")
			errors.push(`${label}[${i}]: falta ${t?.type === "console" ? '"expected"' : '"code"'}`);
	});
}

/**
 * Validación estructural del JSON de un reto o incidencia. La comprobación de
 * comportamiento (la solución pasa, el código inicial falla) se hace después
 * ejecutando los tests en el navegador.
 */
export function validateDraft(text: string, kind: "challenge" | "incident"): { ok: true; spec: ChallengeSpec | IncidentSpec } | { ok: false; errors: string[] } {
	let raw: Record<string, unknown>;
	try {
		raw = JSON.parse(text) as Record<string, unknown>;
	} catch (e) {
		return { ok: false, errors: [`JSON no válido: ${(e as Error).message}`] };
	}
	const errors: string[] = [];
	const str = (k: string) => typeof raw[k] === "string" && (raw[k] as string).trim().length > 0;
	if (!str("id") || !/^[a-z0-9][a-z0-9-]{2,60}$/.test(String(raw.id))) errors.push('"id": minúsculas, números y guiones (3-60 caracteres)');
	if (!str("title")) errors.push('Falta "title"');
	if (!LEVELS.includes(String(raw.difficulty))) errors.push('"difficulty" debe ser junior, semi_senior o senior');
	if (!Array.isArray(raw.concepts) || !raw.concepts.every((c) => typeof c === "string")) errors.push('"concepts" debe ser una lista de textos');
	const files = raw.files as Record<string, unknown> | undefined;
	if (!files || !FILE_NAMES.every((f) => typeof files[f] === "string")) errors.push('"files" necesita index.html, styles.css y app.js (texto, aunque sea vacío)');
	if (!Array.isArray(raw.editable) || raw.editable.length === 0 || !raw.editable.every((f) => FILE_NAMES.includes(f))) errors.push('"editable" debe listar archivos de "files"');
	const solution = raw.solution as Record<string, unknown> | undefined;
	if (!solution || typeof solution !== "object" || Object.keys(solution).length === 0) errors.push('"solution" debe cambiar al menos un archivo');
	else for (const f of Object.keys(solution)) if (!Array.isArray(raw.editable) || !raw.editable.includes(f)) errors.push(`"solution" cambia ${f}, que no es editable`);
	if (!Array.isArray(raw.hints)) errors.push('"hints" debe ser una lista (puede estar vacía)');
	checkTests(raw.tests, "tests", errors);

	if (kind === "challenge") {
		if (!CATEGORIES.includes(String(raw.category))) errors.push(`"category" debe ser una de: ${CATEGORIES.join(", ")}`);
		if (!str("instructions")) errors.push('Falta "instructions"');
	} else {
		if (raw.type !== "incident") errors.push('"type" debe ser "incident"');
		const t = raw.ticket as Record<string, unknown> | undefined;
		if (!t || !Array.isArray(t.steps) || typeof t.expected !== "string" || typeof t.actual !== "string") errors.push('"ticket" necesita steps, expected y actual');
		if (![390, 768, 1280].includes(Number(raw.viewport))) errors.push('"viewport" debe ser 390, 768 o 1280');
		if (!str("rootCause")) errors.push('Falta "rootCause"');
		checkTests(raw.regressionTests, "regressionTests", errors);
		if (!Array.isArray(raw.networkLog)) errors.push('"networkLog" debe ser una lista (puede estar vacía)');
	}
	return errors.length ? { ok: false, errors } : { ok: true, spec: raw as unknown as ChallengeSpec | IncidentSpec };
}
