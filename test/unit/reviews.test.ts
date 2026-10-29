import { describe, it, expect } from "vitest";
import { REVIEWS } from "../../src/content/reviews";
import { issueRange, parseDiff } from "../../src/features/reviews/types";
import { scoreReview } from "../../src/features/reviews/scoring";

describe("revisiones de código de IA", () => {
	it("8 revisiones de 30 a 80 líneas con 2-3 fallos y categorías variadas", () => {
		expect(REVIEWS).toHaveLength(8);
		for (const r of REVIEWS) {
			const rows = parseDiff(r.diff);
			expect(rows.length, r.id).toBeGreaterThanOrEqual(30);
			expect(rows.length, r.id).toBeLessThanOrEqual(80);
			expect(r.issues.length).toBeGreaterThanOrEqual(2);
			expect(r.issues.length).toBeLessThanOrEqual(3);
			// Cada fallo se localiza en un único sitio y no se solapa con otro
			const ranges = r.issues.map((i) => issueRange(rows, i));
			for (const [, b] of ranges) expect(b).toBeLessThanOrEqual(rows.length);
			const sorted = [...ranges].sort((x, y) => x[0] - y[0]);
			for (let i = 1; i < sorted.length; i++) expect(sorted[i][0], r.id).toBeGreaterThan(sorted[i - 1][1]);
		}
		const cats = new Set(REVIEWS.flatMap((r) => r.issues.map((i) => i.category)));
		expect(cats).toEqual(new Set(["seguridad", "bug", "rendimiento", "accesibilidad"]));
	});

	it("parseDiff numera líneas antiguas y nuevas", () => {
		expect(parseDiff(" a\n-b\n+c\n d")).toEqual([
			{ n: 1, kind: " ", text: "a", oldNo: 1, newNo: 1 },
			{ n: 2, kind: "-", text: "b", oldNo: 2, newNo: null },
			{ n: 3, kind: "+", text: "c", oldNo: null, newNo: 2 },
			{ n: 4, kind: " ", text: "d", oldNo: 3, newNo: 3 },
		]);
	});

	it("puntuación: aciertos, categoría equivocada y falsos positivos", () => {
		const spec = REVIEWS[0];
		const rows = parseDiff(spec.diff);
		const [xss, race] = spec.issues.map((i) => issueRange(rows, i));
		const out = scoreReview(spec, [
			{ id: "c1", row: xss[0] + 1, category: "seguridad", text: "innerHTML con datos de usuario" },
			{ id: "c2", row: race[0], category: "rendimiento", text: "¿carrera?" },
			{ id: "c3", row: 1, category: "bug", text: "import raro" },
		]);
		expect(out.found).toEqual([{ issueId: "xss", commentId: "c1" }]);
		expect(out.wrongCategory).toEqual([{ issueId: "race", commentId: "c2" }]);
		expect(out.falsePositives).toEqual(["c3"]);
		expect(out.missed).toEqual(["ok"]);
		expect(out.score).toBe(100 + 30 - 25);
		expect(out.max).toBe(300);
	});

	it("comentar todas las líneas no compensa", () => {
		const spec = REVIEWS[1];
		const rows = parseDiff(spec.diff);
		const spam = rows.map((r) => ({ id: `c${r.n}`, row: r.n, category: "seguridad" as const, text: "x" }));
		const out = scoreReview(spec, spam);
		expect(out.falsePositives.length).toBeGreaterThan(15);
		expect(out.score).toBeLessThan(out.max / 2);
	});
});
