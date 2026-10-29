import type { Confidence } from "./fsrs";

export type GradedAnswer = {
	correct: boolean;
	confidence: Confidence;
	concepts: { id: string; name: string }[];
};

export type CalibrationRow = { confidence: Confidence; correct: number; total: number; pct: number };

/** % de aciertos por nivel de confianza (Seguro, Creo que sí, Adivino). */
export function calibration(answers: GradedAnswer[]): CalibrationRow[] {
	return (["seguro", "creo", "adivino"] as Confidence[]).map((confidence) => {
		const rows = answers.filter((a) => a.confidence === confidence);
		const correct = rows.filter((a) => a.correct).length;
		return { confidence, correct, total: rows.length, pct: rows.length ? Math.round((correct / rows.length) * 100) : 0 };
	});
}

export type ConceptSplit = { strong: { id: string; name: string }[]; weak: { id: string; name: string }[] };

/**
 * Dominados: todas sus respuestas acertadas y ninguna adivinada.
 * A reforzar: algún fallo (o solo aciertos adivinando).
 */
export function splitConcepts(answers: GradedAnswer[]): ConceptSplit {
	const by = new Map<string, { name: string; ok: number; fail: number; guessed: number }>();
	for (const a of answers)
		for (const c of a.concepts) {
			const e = by.get(c.id) ?? { name: c.name, ok: 0, fail: 0, guessed: 0 };
			if (a.correct) e.ok++;
			else e.fail++;
			if (a.correct && a.confidence === "adivino") e.guessed++;
			by.set(c.id, e);
		}
	const strong: ConceptSplit["strong"] = [];
	const weak: { id: string; name: string; score: number }[] = [];
	for (const [id, e] of by) {
		if (e.fail > 0 || (e.ok > 0 && e.guessed === e.ok)) weak.push({ id, name: e.name, score: e.fail * 2 + e.guessed });
		else strong.push({ id, name: e.name });
	}
	// Los más flojos primero
	weak.sort((a, b) => b.score - a.score);
	return { strong, weak: weak.map(({ id, name }) => ({ id, name })) };
}

/** Titular de diagnóstico: "Dominas X. Y todavía te engaña." */
export function diagnosisHeadline(split: ConceptSplit, overconfident: number): string {
	const s = split.strong.slice(0, 2).map((c) => c.name);
	const w = split.weak[0]?.name;
	const join = (xs: string[]) => (xs.length === 2 ? `${xs[0]} y ${xs[1]}` : xs[0]);
	if (s.length && w) return `Dominas ${join(s)}. ${w} todavía te engaña.`;
	if (s.length) return `Dominas ${join(s)}. ¡Sigue así!`;
	if (w && overconfident > 0) return `${w} te engaña: fallaste aunque estabas seguro.`;
	if (w) return `${w} necesita repaso: vamos a reforzarlo.`;
	return "Quiz completado.";
}

/** Fallos marcados como "Seguro": el aviso de calibración. */
export const overconfidentCount = (answers: GradedAnswer[]) =>
	answers.filter((a) => !a.correct && a.confidence === "seguro").length;

/** Nivel según el diagnóstico inicial (% de aciertos). */
export function levelFromDiagnostic(correct: number, total: number): "junior" | "semi_senior" | "senior" {
	const pct = total ? correct / total : 0;
	return pct >= 0.8 ? "senior" : pct >= 0.5 ? "semi_senior" : "junior";
}

/** Marca de "diagnóstico inicial hecho" en el dispositivo. */
export const DIAGNOSTIC_DONE_KEY = "webwiz-diagnostico-hecho";
