const KEY = "webwiz-reviews-done";

/** Mejor puntuación de cada revisión en este dispositivo. */
export function getReviewScores(): Record<string, number> {
	try {
		return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, number>;
	} catch {
		return {};
	}
}

export function markReviewDone(id: string, score: number) {
	const all = getReviewScores();
	if (all[id] === undefined || all[id] < score) all[id] = score;
	try {
		localStorage.setItem(KEY, JSON.stringify(all));
	} catch {
		// sin almacenamiento
	}
}
