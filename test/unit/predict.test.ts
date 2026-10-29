// @vitest-environment node
import { describe, it, expect } from "vitest";
import vm from "node:vm";
import { PREDICT_QUESTIONS } from "../../src/content/questions/predict";
import { CONCEPT_CATALOG } from "../../src/features/learning/concepts";

/** Ejecuta el código y devuelve su salida como en la app: logs unidos por ", ". */
async function run(code: string): Promise<string> {
	const out: string[] = [];
	const fmt = (v: unknown) => (typeof v === "string" ? v : String(v));
	const context = vm.createContext({
		console: { log: (...a: unknown[]) => out.push(a.map(fmt).join(" ")) },
		setTimeout,
		Promise,
		parseInt,
		structuredClone,
	});
	try {
		// Como módulo: this es undefined en el nivel superior
		await vm.runInContext(`(async function () { "use strict"; ${code}\n}).call(undefined)`, context);
	} catch (e) {
		out.push((e as Error).name);
	}
	await new Promise((r) => setTimeout(r, 20));
	return out.map((l) => (l === "" ? "(vacío)" : l)).join(", ");
}

describe("preguntas de predicción", () => {
	it.each(PREDICT_QUESTIONS.map((q) => [q.id.slice(-2), q] as const))("pregunta %s: la respuesta correcta es la salida real", async (_, q) => {
		expect(await run(q.code)).toBe(q.correctAnswer);
		expect(q.options).toContain(q.correctAnswer);
		expect(new Set(q.options).size).toBe(4);
		// Cada opción incorrecta explica su confusión
		for (const o of q.options.filter((o) => o !== q.correctAnswer)) {
			expect(q.optionMeta[o]?.misconception, `${q.id}: ${o}`).toBeTruthy();
			expect(q.optionMeta[o]?.whyTempting).toBeTruthy();
		}
		for (const c of q.concepts) expect(CONCEPT_CATALOG.map((x) => x.id)).toContain(c);
	});
});
