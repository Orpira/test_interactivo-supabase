import { createEmptyCard, fsrs, generatorParameters, Rating, type Card, type Grade } from "ts-fsrs";

/** Confianza declarada antes de comprobar la respuesta. */
export type Confidence = "adivino" | "creo" | "seguro";

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
	adivino: "Adivino",
	creo: "Creo que sí",
	seguro: "Seguro",
};

export type ConceptState = "dominado" | "progreso" | "reforzar" | "nuevo";

export const STATE_LABEL: Record<ConceptState, string> = {
	dominado: "Dominado",
	progreso: "En progreso",
	reforzar: "A reforzar",
	nuevo: "Sin empezar",
};

/**
 * Respuesta + confianza → calificación FSRS.
 *  - fallo (con cualquier confianza) = Again
 *  - acierto adivinando = Hard; con "Creo que sí" = Good; seguro = Easy
 */
export function ratingFor(correct: boolean, confidence: Confidence): Grade {
	if (!correct) return Rating.Again;
	return confidence === "adivino" ? Rating.Hard : confidence === "creo" ? Rating.Good : Rating.Easy;
}

/** Veredicto que combina acierto y confianza. */
export function verdictFor(correct: boolean, confidence: Confidence): { text: string; tone: "ok" | "warn" } {
	if (!correct) return { text: confidence === "seguro" ? "Fallo con confianza alta" : confidence === "adivino" ? "Fallo, pero lo sabías" : "Fallo", tone: "warn" };
	return { text: confidence === "adivino" ? "Acierto, pero adivinando" : "Correcto", tone: "ok" };
}

// Sin pasos de aprendizaje intradía: el repaso es diario, por concepto
const scheduler = fsrs(generatorParameters({ enable_short_term: false, enable_fuzz: false }));

/** Tarjeta serializable (fechas en ISO) para localStorage y Supabase. */
export type StoredCard = {
	conceptId: string;
	name: string;
	area: string;
	fsrs: Omit<Card, "due" | "last_review"> & { due: string; last_review?: string | null };
	/** Tarjeta antes del primer repaso del día (para no contar dos veces el mismo día) */
	dayBase?: StoredCard["fsrs"] | null;
	lastRating: Grade;
	lastReason: string;
	state: ConceptState;
	due: string;
	updatedAt: string;
};

const toCard = (c: StoredCard["fsrs"]): Card => ({
	...c,
	due: new Date(c.due),
	last_review: c.last_review ? new Date(c.last_review) : undefined,
});
const fromCard = (c: Card): StoredCard["fsrs"] => ({
	...c,
	due: c.due.toISOString(),
	last_review: c.last_review ? c.last_review.toISOString() : null,
});

export const sameDay = (a: Date, b: Date) =>
	a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function stateFromCard(card: Card, lastRating: Grade): ConceptState {
	if (lastRating === Rating.Again) return "reforzar";
	// Dominado: al menos dos repasos en días distintos y memoria estable (≥ 7 días)
	if (card.reps >= 2 && card.stability >= 7 && lastRating >= Rating.Good) return "dominado";
	return "progreso";
}

const REASON: Record<number, string> = {
	[Rating.Again]: "Fallaste la última pregunta de este concepto",
	[Rating.Hard]: "Acertaste, pero adivinando",
	[Rating.Good]: "Acertaste con bastante seguridad",
	[Rating.Easy]: "Acertaste con total seguridad",
};

/**
 * Aplica una respuesta a la tarjeta del concepto. Varias respuestas del mismo
 * concepto en el mismo día cuentan como un solo repaso, con la peor nota.
 */
export function reviewConcept(
	prev: StoredCard | undefined,
	concept: { id: string; name: string; area: string },
	rating: Grade,
	now: Date = new Date(),
): StoredCard {
	let base: StoredCard["fsrs"];
	let grade = rating;
	if (prev && prev.fsrs.last_review && sameDay(new Date(prev.fsrs.last_review), now)) {
		base = prev.dayBase ?? fromCard(createEmptyCard(now));
		grade = Math.min(prev.lastRating, rating) as Grade;
	} else {
		base = prev ? prev.fsrs : fromCard(createEmptyCard(now));
	}
	const next = scheduler.next(toCard(base), now, grade).card;
	const state = stateFromCard(next, grade);
	const reason =
		state === "dominado"
			? `Lo has acertado con seguridad en varios días; vuelve en ${daysUntil(next.due, now)} días`
			: REASON[grade];
	return {
		conceptId: concept.id,
		name: concept.name,
		area: concept.area,
		fsrs: fromCard(next),
		dayBase: base,
		lastRating: grade,
		lastReason: reason,
		state,
		due: next.due.toISOString(),
		updatedAt: now.toISOString(),
	};
}

export function daysUntil(due: Date, now: Date = new Date()): number {
	const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
	const b = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
	return Math.max(0, Math.round((b - a) / 86_400_000));
}

/** "mañana", "en 3 días", "hoy" */
export function returnsLabel(due: string | Date, now: Date = new Date()): string {
	const d = daysUntil(new Date(due), now);
	return d === 0 ? "hoy" : d === 1 ? "mañana" : `en ${d} días`;
}

/** Vence hoy (o antes): entra en el repaso del día. */
export function isDue(card: StoredCard, now: Date = new Date()): boolean {
	return daysUntil(new Date(card.due), now) === 0;
}

/** Probabilidad de recordar ahora (para "a punto de olvidarse"). */
export function retrievability(card: StoredCard, now: Date = new Date()): number {
	return scheduler.get_retrievability(toCard(card.fsrs), now, false) as number;
}
