/**
 * Diferencia por líneas (LCS). Los archivos de las incidencias son pequeños
 * (< 200 líneas), así que la tabla completa es suficiente y exacta.
 */
export type DiffStats = { added: number; removed: number; changed: number };

export function diffLines(before: string, after: string): DiffStats {
	const a = before.replace(/\r\n/g, "\n").split("\n");
	const b = after.replace(/\r\n/g, "\n").split("\n");
	const n = a.length;
	const m = b.length;
	// lcs[i][j] = LCS de a[i..] y b[j..]
	const lcs: Uint16Array[] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
	for (let i = n - 1; i >= 0; i--) {
		for (let j = m - 1; j >= 0; j--) {
			lcs[i][j] = a[i].trimEnd() === b[j].trimEnd() ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
		}
	}
	let i = 0;
	let j = 0;
	let added = 0;
	let removed = 0;
	let changed = 0;
	// Un bloque contiguo de borrados + añadidos cuenta como max(borrados, añadidos)
	let hunkAdd = 0;
	let hunkDel = 0;
	const closeHunk = () => {
		changed += Math.max(hunkAdd, hunkDel);
		hunkAdd = 0;
		hunkDel = 0;
	};
	while (i < n || j < m) {
		if (i < n && j < m && a[i].trimEnd() === b[j].trimEnd()) {
			closeHunk();
			i++;
			j++;
		} else if (j < m && (i >= n || lcs[i][j + 1] >= lcs[i + 1][j])) {
			added++;
			hunkAdd++;
			j++;
		} else {
			removed++;
			hunkDel++;
			i++;
		}
	}
	closeHunk();
	return { added, removed, changed };
}

/** Líneas cambiadas en total entre dos conjuntos de archivos. */
export function changedLines(base: Record<string, string>, next: Record<string, string>, files: string[]): number {
	return files.reduce((sum, f) => sum + diffLines(base[f] ?? "", next[f] ?? "").changed, 0);
}
