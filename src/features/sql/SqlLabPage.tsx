import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Database, Lightbulb, Loader2, Play, X } from "lucide-react";
import { SQL_EXERCISES, type SqlExercise } from "@/content/topics/sql";
import CodeMirrorEditor from "@/features/editor/CodeMirrorEditor";
import { LEVEL_LABEL } from "@/features/editor/languages";
import { useAuth } from "@/services/auth";
import { pushAnswer } from "@/services/learningSync";
import { conceptsForQuestion } from "@/features/learning/concepts";
import { useLearning } from "@/features/learning/store";
import { checkExercise, type SqlResult, type SqlRun } from "./engine";
import { markSolved } from "./progress";

const SCHEMA = [
	{ table: "clientes", cols: "id, nombre, ciudad, alta" },
	{ table: "productos", cols: "id, nombre, categoria, precio" },
	{ table: "pedidos", cols: "id, cliente_id → clientes, fecha" },
	{ table: "lineas", cols: "pedido_id → pedidos, producto_id → productos, cantidad" },
];

export default function SqlLabPage() {
	const { id } = useParams();
	const ex = SQL_EXERCISES.find((e) => e.id === id);
	if (!ex)
		return (
			<div className="space-y-3 p-6 text-center">
				<p>Ejercicio no encontrado.</p>
				<Link to="/sql" className="text-accent underline">
					Ver todos
				</Link>
			</div>
		);
	return <Lab key={ex.id} ex={ex} />;
}

function Lab({ ex }: { ex: SqlExercise }) {
	const navigate = useNavigate();
	const { user } = useAuth();
	const draftKey = `webwiz-sql:${ex.id}`;
	const [sql, setSql] = useState(() => localStorage.getItem(draftKey) ?? ex.starter);
	const [state, setState] = useState<{ running: boolean; run?: SqlRun; passed?: boolean; expected?: SqlResult | null }>({ running: false });
	const [hints, setHints] = useState(0);
	const index = SQL_EXERCISES.indexOf(ex);
	const next = SQL_EXERCISES[index + 1];

	useEffect(() => {
		const t = setTimeout(() => {
			try {
				localStorage.setItem(draftKey, sql);
			} catch {
				// sin almacenamiento
			}
		}, 400);
		return () => clearTimeout(t);
	}, [sql, draftKey]);

	const execute = useCallback(async () => {
		setState({ running: true });
		const res = await checkExercise(ex, sql);
		setState({ running: false, ...res });
		if (res.passed) markSolved(ex.id);
		const record = { questionId: ex.id, chosen: "sql", correct: res.passed, confidence: "creo" as const, concepts: conceptsForQuestion({ concepts: ex.concepts }) };
		const learned = useLearning.getState().recordAnswer(record);
		if (user) void pushAnswer(user.id, record, learned.cards, useLearning.getState().streak);
	}, [ex, sql, user]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
				e.preventDefault();
				void execute();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [execute]);

	const run = state.run;
	return (
		<section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">
			<Link to="/sql" className="inline-flex min-h-8 items-center gap-1 font-mono text-xs text-muted hover:text-fg">
				<ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Laboratorio SQL · {index + 1} de {SQL_EXERCISES.length}
			</Link>
			<div className="mt-2 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
				<div className="min-w-0 space-y-3">
					<div className="flex flex-wrap items-center gap-2">
						<h1 className="font-display text-xl font-bold sm:text-2xl">{ex.title}</h1>
						<span className="rounded-full border border-line px-2.5 py-0.5 font-mono text-xs text-muted">{LEVEL_LABEL[ex.difficulty]}</span>
					</div>
					<p>{ex.instructions}</p>
					{hints > 0 && (
						<ul className="space-y-1 rounded-lg border border-accent/30 bg-accent-soft p-3 text-sm">
							{ex.hints.slice(0, hints).map((h) => (
								<li key={h}>💡 {h}</li>
							))}
						</ul>
					)}
					<CodeMirrorEditor value={sql} onChange={setSql} language="sql" label={`Consulta SQL de ${ex.title}`} minHeight="10rem" />
					<div className="flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={() => void execute()}
							disabled={state.running}
							className="inline-flex min-h-touch items-center gap-2 rounded-md bg-accent px-4 font-semibold text-accent-fg hover:bg-accent/90 disabled:opacity-60"
						>
							{state.running ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
							Ejecutar y comprobar
							<kbd aria-hidden="true" className="hidden rounded border border-current px-1 font-mono text-[0.7rem] lg:inline">
								Ctrl+Enter
							</kbd>
						</button>
						<button
							type="button"
							onClick={() => setHints((h) => Math.min(h + 1, ex.hints.length))}
							disabled={hints >= ex.hints.length}
							className="inline-flex min-h-touch items-center gap-2 rounded-md border border-line bg-surface2 px-3 font-medium hover:border-accent/60 disabled:opacity-50"
						>
							<Lightbulb className="h-4 w-4" aria-hidden="true" /> Pista ({ex.hints.length - hints})
						</button>
						<button type="button" onClick={() => setSql(ex.starter)} className="min-h-touch px-2 text-sm text-muted hover:text-fg">
							Restablecer
						</button>
					</div>
					<div aria-live="polite">
						{run && !run.ok && (
							<p role="alert" className="rounded-lg border border-warn/50 bg-warn-soft p-3 font-mono text-sm text-warn">
								{run.error}
							</p>
						)}
						{run?.ok && (
							<div className="space-y-2">
								<p className={`flex items-center gap-1.5 font-semibold ${state.passed ? "text-accent" : "text-warn"}`}>
									{state.passed ? <Check className="h-5 w-5" aria-hidden="true" /> : <X className="h-5 w-5" aria-hidden="true" />}
									{state.passed
										? "¡Correcto! El resultado coincide con el esperado."
										: `El resultado no coincide: ${run.result?.rows.length ?? 0} filas, se esperaban ${state.expected?.rows.length ?? 0}${
												ex.ordered ? " (el orden importa)" : ""
											}.`}
								</p>
								{run.result && <ResultTable result={run.result} label="Tu resultado" />}
								{state.passed && next && (
									<button
										type="button"
										onClick={() => navigate(`/sql/${next.id}`)}
										className="inline-flex min-h-touch items-center gap-2 rounded-md bg-accent px-4 font-semibold text-accent-fg hover:bg-accent/90"
									>
										Siguiente ejercicio <ArrowRight className="h-4 w-4" aria-hidden="true" />
									</button>
								)}
							</div>
						)}
					</div>
				</div>
				<aside className="h-fit rounded-xl border border-line bg-surface p-3" aria-labelledby="esquema">
					<h2 id="esquema" className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-muted">
						<Database className="h-3.5 w-3.5" aria-hidden="true" /> Esquema
					</h2>
					<dl className="mt-2 space-y-2 font-mono text-xs">
						{SCHEMA.map((s) => (
							<div key={s.table}>
								<dt className="font-semibold text-accent">{s.table}</dt>
								<dd className="text-muted">{s.cols}</dd>
							</div>
						))}
					</dl>
					<p className="mt-3 text-xs text-muted">PostgreSQL real en tu navegador (PGlite). Cada ejecución se deshace al terminar: no puedes romper los datos.</p>
				</aside>
			</div>
		</section>
	);
}

function ResultTable({ result, label }: { result: SqlResult; label: string }) {
	if (result.columns.length === 0) return <p className="text-sm text-muted">Sentencia ejecutada{result.affected !== undefined ? ` · ${result.affected} filas afectadas` : ""}.</p>;
	return (
		<div className="max-h-80 overflow-auto rounded-lg border border-line" tabIndex={0} role="region" aria-label={label}>
			<table className="w-full border-collapse font-mono text-xs">
				<caption className="sr-only">{label}</caption>
				<thead className="sticky top-0 bg-surface2 text-left">
					<tr>
						{result.columns.map((c, i) => (
							<th key={`${c}-${i}`} scope="col" className="border-b border-line px-3 py-1.5 font-semibold">
								{c}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{result.rows.slice(0, 200).map((r, i) => (
						<tr key={i} className="border-b border-line/60">
							{r.map((v, j) => (
								<td key={j} className="px-3 py-1.5">
									{v instanceof Date ? v.toISOString().slice(0, 10) : v === null ? <span className="text-muted">NULL</span> : String(v)}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
