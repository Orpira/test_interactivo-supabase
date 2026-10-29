import { describe, it, expect } from "vitest";
import { INCIDENTS } from "../../src/content/incidents";
import { diffLines, changedLines } from "../../src/features/incidents/diff";
import { computeScore, SCORE_BASE } from "../../src/features/incidents/scoring";
import { pushEvent, formatClock, TIMELINE_LIMIT, type TimelineEvent } from "../../src/features/incidents/timeline";
import { INSPECT_PROPS } from "../../src/features/incidents/inspector";

describe("diffLines", () => {
	it("sin cambios", () => {
		expect(diffLines("a\nb\nc", "a\nb\nc")).toEqual({ added: 0, removed: 0, changed: 0 });
	});
	it("una línea modificada cuenta como 1", () => {
		expect(diffLines("a\nb\nc", "a\nB\nc")).toEqual({ added: 1, removed: 1, changed: 1 });
	});
	it("añadidos y borrados en bloques distintos", () => {
		expect(diffLines("a\nb\nc\nd", "a\nx\ny\nb\nd")).toEqual({ added: 2, removed: 1, changed: 3 });
	});
	it("ignora espacios al final de línea y CRLF", () => {
		expect(diffLines("a  \r\nb", "a\nb").changed).toBe(0);
	});
	it("la solución de referencia de cada incidencia cambia pocas líneas", () => {
		for (const inc of INCIDENTS) {
			const ref = changedLines(inc.files, { ...inc.files, ...inc.solution }, inc.editable);
			expect(ref, inc.id).toBeGreaterThan(0);
			expect(ref, inc.id).toBeLessThanOrEqual(25);
		}
	});
});

describe("computeScore", () => {
	const base = { durationMs: 60_000, expectedMin: 10, failedSubmits: 0, hints: 0, regressionBreaks: 0, linesChanged: 2, referenceLines: 2 };
	it("arreglo rápido, limpio y mínimo: base + tiempo + diff", () => {
		expect(computeScore(base).total).toBe(SCORE_BASE + 300 + 200);
	});
	it("el bonus de tiempo baja linealmente hasta el triple de la duración", () => {
		expect(computeScore({ ...base, durationMs: 20 * 60_000 }).total).toBe(SCORE_BASE + 150 + 200);
		expect(computeScore({ ...base, durationMs: 31 * 60_000 }).total).toBe(SCORE_BASE + 200);
	});
	it("penaliza envíos fallidos (con tope), pistas y regresiones", () => {
		const r = computeScore({ ...base, failedSubmits: 10, hints: 2, regressionBreaks: 1 });
		expect(r.total).toBe(SCORE_BASE + 300 - 375 - 200 - 150 + 200);
		expect(r.lines.map((l) => l.points)).toContain(-375);
	});
	it("diff contenido da la mitad y uno grande nada", () => {
		expect(computeScore({ ...base, linesChanged: 4 }).total).toBe(SCORE_BASE + 300 + 100);
		expect(computeScore({ ...base, linesChanged: 30 }).total).toBe(SCORE_BASE + 300);
	});
	it("nunca es negativa", () => {
		expect(computeScore({ ...base, durationMs: 1e9, failedSubmits: 50, hints: 10, regressionBreaks: 20, linesChanged: 99 }).total).toBe(0);
	});
});

describe("línea de tiempo", () => {
	it("agrupa ediciones seguidas y descarta duplicados", () => {
		let l: TimelineEvent[] = [{ t: 0, kind: "start", label: "Abrió el ticket" }];
		l = pushEvent(l, { t: 1, kind: "edit", label: "Editó app.js" });
		l = pushEvent(l, { t: 3, kind: "edit", label: "Editó app.js" });
		l = pushEvent(l, { t: 5, kind: "edit", label: "Editó styles.css" });
		l = pushEvent(l, { t: 6, kind: "panel", label: "Abrió Red" });
		l = pushEvent(l, { t: 7, kind: "panel", label: "Abrió Red" });
		expect(l.map((e) => e.label)).toEqual(["Abrió el ticket", "Editó app.js", "Editó styles.css", "Abrió Red"]);
		expect(l[1].t).toBe(3);
	});
	it("conserva el inicio y limita el tamaño", () => {
		let l: TimelineEvent[] = [{ t: 0, kind: "start", label: "Abrió el ticket" }];
		for (let i = 0; i < 200; i++) l = pushEvent(l, { t: i, kind: "inspect", label: `nodo ${i}` });
		expect(l).toHaveLength(TIMELINE_LIMIT);
		expect(l[0].kind).toBe("start");
		expect(l.at(-1)?.label).toBe("nodo 199");
	});
	it("formatClock", () => {
		expect(formatClock(0)).toBe("00:00");
		expect(formatClock(605_000)).toBe("10:05");
	});
});

describe("catálogo de incidencias", () => {
	it("10 incidencias: 4 CSS, 3 JS, 2 accesibilidad y 1 seguridad", () => {
		const by = (a: string) => INCIDENTS.filter((i) => i.area === a).length;
		expect(INCIDENTS).toHaveLength(10);
		expect([by("css"), by("javascript"), by("accesibilidad"), by("seguridad")]).toEqual([4, 3, 2, 1]);
	});
	it("ids y números únicos y coherentes", () => {
		expect(new Set(INCIDENTS.map((i) => i.id)).size).toBe(INCIDENTS.length);
		for (const i of INCIDENTS) expect(i.id).toBe(`inc-${i.number}`);
	});
	it.each(INCIDENTS.map((i) => [i.id, i] as const))("%s está completa", (_, i) => {
		expect(i.type).toBe("incident");
		expect(i.tests.length).toBeGreaterThanOrEqual(2);
		expect(i.regressionTests.length).toBeGreaterThanOrEqual(2);
		expect(i.hints.length).toBeGreaterThanOrEqual(1);
		expect(i.ticket.steps.length).toBeGreaterThan(0);
		expect(i.rootCause.length).toBeGreaterThan(80);
		// La solución solo toca archivos editables
		for (const f of Object.keys(i.solution)) expect(i.editable).toContain(f);
		// Los sospechosos existen en el panel Elementos
		for (const p of i.suspects) expect(INSPECT_PROPS).toContain(p);
		// Nombres de test únicos (el runner los empareja por nombre)
		const names = [...i.tests, ...i.regressionTests].map((t) => t.name);
		expect(new Set(names).size).toBe(names.length);
		for (const m of i.networkLog) expect(m.url.startsWith("/")).toBe(true);
	});
});
