import { issueRange, parseDiff, type ReviewCategory, type ReviewSpec } from "./types";

export type ReviewComment = { id: string; row: number; category: ReviewCategory; text: string };

export type ReviewOutcome = {
	found: { issueId: string; commentId: string }[];
	wrongCategory: { issueId: string; commentId: string }[];
	missed: string[];
	falsePositives: string[];
	score: number;
	max: number;
};

/** Margen de líneas alrededor del fallo que cuenta como acierto. */
export const ROW_TOLERANCE = 1;
export const POINTS = { found: 100, wrongCategory: 30, falsePositive: -25 };

/**
 * Acierto: comentario dentro del rango del fallo (±1 línea) y con su categoría.
 * Rango correcto pero otra categoría: puntos parciales. Comentarios que no caen
 * en ningún fallo: falsos positivos (penalizan).
 */
export function scoreReview(spec: ReviewSpec, comments: ReviewComment[]): ReviewOutcome {
	const rows = parseDiff(spec.diff);
	const ranges = spec.issues.map((i) => ({ issue: i, range: issueRange(rows, i) }));
	const inRange = (row: number, [a, b]: [number, number]) => row >= a - ROW_TOLERANCE && row <= b + ROW_TOLERANCE;

	const used = new Set<string>();
	const found: ReviewOutcome["found"] = [];
	const wrongCategory: ReviewOutcome["wrongCategory"] = [];
	for (const { issue, range } of ranges) {
		const exact = comments.find((c) => !used.has(c.id) && inRange(c.row, range) && c.category === issue.category);
		if (exact) {
			used.add(exact.id);
			found.push({ issueId: issue.id, commentId: exact.id });
		}
	}
	for (const { issue, range } of ranges) {
		if (found.some((f) => f.issueId === issue.id)) continue;
		const near = comments.find((c) => !used.has(c.id) && inRange(c.row, range));
		if (near) {
			used.add(near.id);
			wrongCategory.push({ issueId: issue.id, commentId: near.id });
		}
	}
	// Varios comentarios sobre un mismo fallo ya encontrado no penalizan
	const falsePositives = comments
		.filter((c) => !used.has(c.id) && !ranges.some(({ range }) => inRange(c.row, range)))
		.map((c) => c.id);
	const missed = spec.issues.filter((i) => !found.some((f) => f.issueId === i.id) && !wrongCategory.some((w) => w.issueId === i.id)).map((i) => i.id);
	const raw = found.length * POINTS.found + wrongCategory.length * POINTS.wrongCategory + falsePositives.length * POINTS.falsePositive;
	return { found, wrongCategory, missed, falsePositives, score: Math.max(0, raw), max: spec.issues.length * POINTS.found };
}
