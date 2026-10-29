const KEY = "webwiz-git-resueltos";

export function getGitSolved(): Set<string> {
	try {
		return new Set(JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[]);
	} catch {
		return new Set();
	}
}

export function markGitSolved(id: string) {
	const s = getGitSolved();
	s.add(id);
	try {
		localStorage.setItem(KEY, JSON.stringify([...s]));
	} catch {
		// sin almacenamiento
	}
}
