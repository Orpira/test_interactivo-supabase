const KEY = "webwiz-sql-resueltos";

export function getSolved(): Set<string> {
	try {
		return new Set(JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[]);
	} catch {
		return new Set();
	}
}

export function markSolved(id: string) {
	const s = getSolved();
	s.add(id);
	try {
		localStorage.setItem(KEY, JSON.stringify([...s]));
	} catch {
		// sin almacenamiento
	}
}
