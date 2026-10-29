export type ReviewCategory = "seguridad" | "bug" | "rendimiento" | "accesibilidad";

export const CATEGORY_LABEL: Record<ReviewCategory, string> = {
	seguridad: "Seguridad",
	bug: "Bug",
	rendimiento: "Rendimiento",
	accesibilidad: "Accesibilidad",
};

export type ReviewIssue = {
	id: string;
	category: ReviewCategory;
	/** Texto único de la primera línea del fallo en el diff */
	match: string;
	/** Nº de líneas que abarca el fallo desde `match` (por defecto 1) */
	span?: number;
	title: string;
	explanation: string;
	concepts: string[];
};

/** "Revisa el código de la IA": un PR generado por IA con fallos sutiles. */
export type ReviewSpec = {
	id: string;
	type: "review";
	title: string;
	/** Descripción del PR tal como la escribió "la IA" */
	description: string;
	file: string;
	language: "javascript" | "typescript" | "tsx" | "sql" | "html";
	difficulty: "junior" | "semi_senior" | "senior";
	/** Diff unificado: cada línea empieza por "+", "-" o " " */
	diff: string;
	issues: ReviewIssue[];
};

export type DiffRow = { n: number; kind: "+" | "-" | " "; text: string; oldNo: number | null; newNo: number | null };

export function parseDiff(diff: string): DiffRow[] {
	let oldNo = 0;
	let newNo = 0;
	return diff
		.replace(/\n$/, "")
		.split("\n")
		.map((line, i) => {
			const kind = (line[0] === "+" || line[0] === "-" ? line[0] : " ") as DiffRow["kind"];
			const text = line.slice(1);
			if (kind !== "+") oldNo++;
			if (kind !== "-") newNo++;
			return { n: i + 1, kind, text, oldNo: kind === "+" ? null : oldNo, newNo: kind === "-" ? null : newNo };
		});
}

/** Filas (1..n) que ocupa cada fallo. */
export function issueRange(rows: DiffRow[], issue: ReviewIssue): [number, number] {
	const hits = rows.filter((r) => r.text.includes(issue.match));
	if (hits.length !== 1) throw new Error(`«${issue.match}» aparece ${hits.length} veces en el diff`);
	return [hits[0].n, hits[0].n + (issue.span ?? 1) - 1];
}
