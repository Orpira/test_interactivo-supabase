import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
	ArrowLeft,
	ArrowRight,
	CheckCircle2,
	CircleDashed,
	Lightbulb,
	Lock,
	Play,
	RotateCcw,
	TriangleAlert,
} from "lucide-react";
import { useChallengeStore } from "@/store/challengeStore";
import { useAuth } from "@/services/auth";
import CodeEditor from "@/features/editor/CodeEditor";
import { LEVEL_LABEL, languageOfFile } from "@/features/editor/languages";
import { buildDocument } from "../engine/buildDocument";
import { runChallengeTests, SANDBOX } from "../engine/runner";
import {
	FILE_NAMES,
	type ChallengeFiles,
	type ChallengeSpec,
	type FileName,
	type TestResult,
} from "../engine/types";
import { saveAttempt } from "@/services/challengeAttempts";
import { markChallengeSolved } from "../progress";
import { InlineCode } from "@/components/quiz/RichText";

export default function ChallengeEditorPage() {
	const { id } = useParams();
	const { challenges, loaded, fetchChallenges } = useChallengeStore();

	useEffect(() => {
		void fetchChallenges();
	}, [fetchChallenges]);

	const challenge = challenges.find((c) => c.id === id);

	if (!challenge) {
		return loaded ? (
			<div className="space-y-3 p-6 text-center">
				<p>Reto no encontrado.</p>
				<Link to="/editor" className="text-accent underline">
					Ver todos los retos
				</Link>
			</div>
		) : (
			<p className="p-6 text-center text-muted">Cargando reto...</p>
		);
	}

	// key: al cambiar de reto se reinicia todo el estado del espacio de trabajo
	return <ChallengeWorkspace key={challenge.id} challenge={challenge} all={challenges} />;
}

function ChallengeWorkspace({ challenge, all }: { challenge: ChallengeSpec; all: ChallengeSpec[] }) {
	const navigate = useNavigate();
	const { user } = useAuth();
	const [files, setFiles] = useState<ChallengeFiles>(challenge.files);
	const visibleFiles = FILE_NAMES.filter(
		(f) => challenge.editable.includes(f) || challenge.files[f].trim(),
	);
	const [activeFile, setActiveFile] = useState<FileName>(challenge.editable[0]);
	const [results, setResults] = useState<TestResult[] | null>(null);
	const [running, setRunning] = useState(false);
	const [hintsShown, setHintsShown] = useState(0);
	const startedAt = useRef(Date.now());

	const siblings = all.filter((c) => c.category === challenge.category);
	const index = siblings.findIndex((c) => c.id === challenge.id);
	const next = siblings[index + 1];
	const prev = siblings[index - 1];
	const passedAll = !!results && results.every((r) => r.passed);

	// Vista previa con un pequeño retardo para no recargar en cada tecla
	const [previewFiles, setPreviewFiles] = useState(files);
	useEffect(() => {
		const t = setTimeout(() => setPreviewFiles(files), 400);
		return () => clearTimeout(t);
	}, [files]);
	const srcDoc = useMemo(() => buildDocument(previewFiles), [previewFiles]);

	const run = useCallback(async () => {
		setRunning(true);
		const res = await runChallengeTests(files, challenge.tests);
		setResults(res);
		setRunning(false);
		const ok = res.every((r) => r.passed);
		if (ok) markChallengeSolved(challenge.id);
		if (user) {
			const editedCode = Object.fromEntries(challenge.editable.map((f) => [f, files[f]]));
			void saveAttempt({
				userId: user.id,
				challengeId: challenge.id,
				code: editedCode,
				results: res,
				hintsUsed: hintsShown,
				durationMs: Date.now() - startedAt.current,
			});
		}
	}, [files, challenge, user, hintsShown]);

	// Ctrl/Cmd + Enter ejecuta los tests desde el editor
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
				e.preventDefault();
				if (!running) void run();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [run, running]);

	const passedCount = results?.filter((r) => r.passed).length ?? 0;

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
			<nav className="mb-3 font-mono text-xs text-muted" aria-label="Migas de pan">
				<Link to="/editor" className="hover:text-fg hover:underline">
					Retos
				</Link>{" "}
				/{" "}
				<Link to={`/editor?categoria=${challenge.category}`} className="hover:text-fg hover:underline">
					{challenge.category.toUpperCase()}
				</Link>{" "}
				/ {index + 1} de {siblings.length}
			</nav>

			<div className="flex flex-wrap items-center gap-2">
				<h1 className="text-2xl font-bold sm:text-3xl">{challenge.title}</h1>
				<span className="rounded-full border border-line px-2.5 py-0.5 font-mono text-xs text-muted">
					{LEVEL_LABEL[challenge.difficulty]}
				</span>
			</div>
			<p className="mt-1 font-mono text-xs text-accent">{challenge.concepts.join(" · ")}</p>
			<p className="mt-3 max-w-3xl leading-relaxed">
				<InlineCode text={challenge.instructions} />
			</p>

			<div className="mt-6 grid gap-6 lg:grid-cols-2">
				{/* Código */}
				<div>
					<div role="tablist" aria-label="Archivos" className="flex gap-1 border-b border-line">
						{visibleFiles.map((f) => {
							const editable = challenge.editable.includes(f);
							const active = activeFile === f;
							return (
								<button
									key={f}
									type="button"
									role="tab"
									aria-selected={active}
									aria-controls="panel-codigo"
									onClick={() => setActiveFile(f)}
									className={`-mb-px inline-flex min-h-touch items-center gap-1.5 border-b-2 px-3 font-mono text-sm ${
										active ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg"
									}`}
								>
									{f}
									{!editable && <Lock className="h-3.5 w-3.5" aria-label="solo lectura" />}
								</button>
							);
						})}
					</div>
					<div id="panel-codigo" role="tabpanel" className="mt-3">
						<CodeEditor
							id={`code-${activeFile}`}
							label={`Editor de ${activeFile}${challenge.editable.includes(activeFile) ? "" : " (solo lectura)"}`}
							value={files[activeFile]}
							language={languageOfFile(activeFile)}
							readOnly={!challenge.editable.includes(activeFile)}
							onChange={(v) => setFiles((prevFiles) => ({ ...prevFiles, [activeFile]: v }))}
							minHeight="20rem"
						/>
					</div>
					<div className="mt-3 flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={() => void run()}
							disabled={running}
							className="inline-flex min-h-touch items-center gap-2 rounded-md bg-accent px-5 font-semibold text-accent-fg hover:bg-accent/90 disabled:opacity-60"
						>
							<Play className="h-4 w-4" aria-hidden="true" />
							{running ? "Ejecutando…" : "Ejecutar tests"}
							<kbd className="hidden font-mono text-[0.7rem] opacity-70 sm:inline">Ctrl+Enter</kbd>
						</button>
						<button
							type="button"
							onClick={() => setHintsShown((n) => Math.min(n + 1, challenge.hints.length))}
							disabled={hintsShown >= challenge.hints.length}
							className="inline-flex min-h-touch items-center gap-2 rounded-md border border-line bg-surface2 px-4 font-medium hover:border-accent/60 disabled:opacity-50"
						>
							<Lightbulb className="h-4 w-4" aria-hidden="true" />
							Pista ({challenge.hints.length - hintsShown})
						</button>
						<button
							type="button"
							onClick={() => {
								setFiles(challenge.files);
								setResults(null);
							}}
							className="inline-flex min-h-touch items-center gap-2 rounded-md px-3 text-sm text-muted hover:text-fg"
						>
							<RotateCcw className="h-4 w-4" aria-hidden="true" />
							Restablecer
						</button>
					</div>
					{hintsShown > 0 && (
						<ol className="mt-3 space-y-2">
							{challenge.hints.slice(0, hintsShown).map((h, i) => (
								<li key={h} className="rounded-lg border border-accent/30 bg-accent-soft px-3 py-2 text-sm">
									<span className="font-mono text-xs text-accent">PISTA {i + 1}</span>
									<p className="mt-0.5">
										<InlineCode text={h} />
									</p>
								</li>
							))}
						</ol>
					)}
				</div>

				{/* Vista previa + tests */}
				<div className="space-y-4">
					<div>
						<h2 className="mb-2 font-display text-lg font-semibold">Vista previa</h2>
						<iframe
							title="Vista previa del reto"
							className="h-72 w-full rounded-lg border border-line bg-white"
							srcDoc={srcDoc}
							sandbox={SANDBOX}
						/>
					</div>

					<section aria-labelledby="tests-title" className="rounded-xl border border-line bg-surface p-4">
						<div className="flex items-center justify-between">
							<h2 id="tests-title" className="font-display text-lg font-semibold">
								Tests
							</h2>
							{results && (
								<span className={`font-mono text-sm font-semibold ${passedAll ? "text-accent" : "text-warn"}`}>
									{passedCount}/{results.length}
								</span>
							)}
						</div>
						<ul className="mt-3 space-y-2" aria-live="polite">
							{challenge.tests.map((t) => {
								const r = results?.find((x) => x.name === t.name);
								return (
									<li key={t.name} className="flex gap-2.5 text-sm">
										{!r ? (
											<CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-label="pendiente" />
										) : r.passed ? (
											<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-label="superado" />
										) : (
											<TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-label="fallado" />
										)}
										<span>
											<span className={r && !r.passed ? "text-warn" : ""}>{t.name}</span>
											{r && !r.passed && (
												<span className="mt-0.5 block whitespace-pre-line font-mono text-xs text-muted">
													{r.message}
												</span>
											)}
										</span>
									</li>
								);
							})}
						</ul>
						{passedAll && (
							<div className="mt-4 rounded-lg border border-accent/50 bg-accent-softer p-3">
								<p className="font-display font-bold text-accent">¡Reto superado!</p>
								<p className="text-sm text-muted">
									{hintsShown === 0 ? "Sin pistas. " : `Con ${hintsShown} pista${hintsShown > 1 ? "s" : ""}. `}
									{next ? "Sigue con el siguiente." : "Has terminado esta categoría."}
								</p>
							</div>
						)}
					</section>
				</div>
			</div>

			<div className="mt-8 flex items-center justify-between gap-3">
				<button
					type="button"
					onClick={() => prev && navigate(`/editor/${prev.category}/${prev.id}`)}
					disabled={!prev}
					className="inline-flex min-h-touch items-center gap-2 rounded-md border border-line bg-surface2 px-4 font-semibold disabled:opacity-40"
				>
					<ArrowLeft className="h-4 w-4" aria-hidden="true" /> Anterior
				</button>
				<button
					type="button"
					onClick={() => next && navigate(`/editor/${next.category}/${next.id}`)}
					disabled={!next}
					className={`inline-flex min-h-touch items-center gap-2 rounded-md px-4 font-semibold disabled:opacity-40 ${
						passedAll ? "bg-accent text-accent-fg" : "border border-line bg-surface2"
					}`}
				>
					Siguiente reto <ArrowRight className="h-4 w-4" aria-hidden="true" />
				</button>
			</div>
		</div>
	);
}
