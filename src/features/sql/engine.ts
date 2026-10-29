import { SQL_SETUP, type SqlExercise } from "@/content/topics/sql";

export type SqlResult = { columns: string[]; rows: unknown[][]; affected?: number };
export type SqlRun = { ok: true; result: SqlResult | null } | { ok: false; error: string };

type PGliteLike = {
	exec: (sql: string) => Promise<{ fields: { name: string }[]; rows: Record<string, unknown>[]; affectedRows?: number }[]>;
	close: () => Promise<void>;
};

let shared: Promise<PGliteLike> | null = null;

/** Una sola base de datos con los datos del laboratorio (PGlite, en el navegador o en Node). */
export function getDb(): Promise<PGliteLike> {
	return (shared ??= (async () => {
		const { PGlite } = await import("@electric-sql/pglite");
		const db = new PGlite() as unknown as PGliteLike;
		await db.exec(SQL_SETUP);
		return db;
	})());
}

const toResult = (r: { fields: { name: string }[]; rows: Record<string, unknown>[]; affectedRows?: number } | undefined): SqlResult | null =>
	r ? { columns: r.fields.map((f) => f.name), rows: r.rows.map((row) => r.fields.map((f) => row[f.name])), affected: r.affectedRows } : null;

// Las ejecuciones se encadenan: cada una va en su transacción y se deshace al final
let queue: Promise<unknown> = Promise.resolve();

/**
 * Ejecuta SQL dentro de una transacción que siempre se deshace (los datos de
 * partida no cambian) y devuelve el resultado de la última sentencia o de `check`.
 */
export function runSql(sql: string, check?: string): Promise<SqlRun> {
	const job = queue.then(async (): Promise<SqlRun> => {
		if (/\b(begin|commit|rollback|savepoint)\b/i.test(sql.replace(/'[^']*'/g, "")))
			return { ok: false, error: "En el laboratorio no se pueden usar BEGIN, COMMIT ni ROLLBACK: cada ejecución ya va en su propia transacción." };
		const db = await getDb();
		await db.exec("BEGIN");
		try {
			const results = await db.exec(sql);
			const out = check ? (await db.exec(check)).at(-1) : results.at(-1);
			return { ok: true, result: toResult(out) };
		} catch (e) {
			return { ok: false, error: translatePgError((e as Error).message) };
		} finally {
			await db.exec("ROLLBACK");
		}
	});
	queue = job.catch(() => undefined);
	return job;
}

const cell = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : v === null || v === undefined ? "NULL" : String(Number.isFinite(Number(v)) && typeof v !== "boolean" && v !== "" ? Number(v) : v));

/** Compara resultados por valores (los nombres de columna no importan). */
export function sameResult(a: SqlResult | null, b: SqlResult | null, ordered: boolean): boolean {
	if (!a || !b) return a === b;
	if (a.columns.length !== b.columns.length || a.rows.length !== b.rows.length) return false;
	const rowsA = a.rows.map((r) => r.map(cell).join("\u0001"));
	const rowsB = b.rows.map((r) => r.map(cell).join("\u0001"));
	if (!ordered) {
		rowsA.sort();
		rowsB.sort();
	}
	return rowsA.every((r, i) => r === rowsB[i]);
}

export async function checkExercise(ex: SqlExercise, sql: string): Promise<{ run: SqlRun; passed: boolean; expected: SqlResult | null }> {
	const run = await runSql(sql, ex.check);
	const expected = await runSql(ex.solution, ex.check);
	const exp = expected.ok ? expected.result : null;
	return { run, expected: exp, passed: run.ok && sameResult(run.result, exp, ex.ordered) };
}

function translatePgError(msg: string) {
	return msg
		.replace(/^syntax error at or near (.+)$/, "Error de sintaxis cerca de $1")
		.replace(/^relation (.+) does not exist$/, "La tabla $1 no existe")
		.replace(/^column (.+) does not exist$/, "La columna $1 no existe")
		.replace(/must appear in the GROUP BY clause or be used in an aggregate function/, "debe aparecer en el GROUP BY o dentro de una función de agregado");
}
