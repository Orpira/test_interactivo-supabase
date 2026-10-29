const KEY = "webwiz-solved-challenges";

/** Retos superados en este dispositivo (para marcar la lista sin consultar la BD). */
export function getSolvedChallenges(): Set<string> {
	try {
		return new Set(JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[]);
	} catch {
		return new Set();
	}
}

export function markChallengeSolved(id: string) {
	const all = getSolvedChallenges();
	all.add(id);
	try {
		localStorage.setItem(KEY, JSON.stringify([...all]));
	} catch {
		// sin almacenamiento: no pasa nada
	}
}
