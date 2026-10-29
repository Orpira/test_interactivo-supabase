/**
 * Puntuación de una incidencia cerrada.
 *  - Base 1000.
 *  - Bonus de tiempo: hasta +300 si se cierra antes de la duración orientativa,
 *    bajando linealmente a 0 al triple de esa duración.
 *  - −75 por cada envío fallido (máx. −375).
 *  - −100 por pista.
 *  - −150 por cada envío que rompió tests de regresión.
 *  - Diff mínimo: +200 si cambias como mucho las líneas de la referencia,
 *    +100 si cambias como mucho el doble.
 */
export type ScoreInput = {
	durationMs: number;
	expectedMin: number;
	failedSubmits: number;
	hints: number;
	regressionBreaks: number;
	linesChanged: number;
	referenceLines: number;
};

export type ScoreLine = { label: string; points: number };
export type ScoreResult = { total: number; lines: ScoreLine[] };

export const SCORE_BASE = 1000;

export function computeScore(input: ScoreInput): ScoreResult {
	const lines: ScoreLine[] = [{ label: "Incidencia resuelta", points: SCORE_BASE }];

	const expectedMs = Math.max(1, input.expectedMin) * 60_000;
	const ratio = input.durationMs / expectedMs;
	const timeBonus = ratio <= 1 ? 300 : ratio >= 3 ? 0 : Math.round(300 * (1 - (ratio - 1) / 2));
	if (timeBonus > 0) lines.push({ label: "Bonus de tiempo", points: timeBonus });

	if (input.failedSubmits > 0)
		lines.push({ label: `${input.failedSubmits} envío(s) fallido(s)`, points: -Math.min(375, 75 * input.failedSubmits) });
	if (input.hints > 0) lines.push({ label: `${input.hints} pista(s)`, points: -100 * input.hints });
	if (input.regressionBreaks > 0)
		lines.push({ label: `${input.regressionBreaks} regresión(es) introducida(s)`, points: -150 * input.regressionBreaks });

	const ref = Math.max(1, input.referenceLines);
	if (input.linesChanged > 0 && input.linesChanged <= ref) lines.push({ label: "Diff mínimo", points: 200 });
	else if (input.linesChanged > 0 && input.linesChanged <= ref * 2) lines.push({ label: "Diff contenido", points: 100 });

	const total = Math.max(0, lines.reduce((s, l) => s + l.points, 0));
	return { total, lines };
}
