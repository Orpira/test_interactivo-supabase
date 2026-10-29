import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { BookOpen, ExternalLink, Flame, Loader2, Play, Repeat, X } from "lucide-react";
import { useQuestions } from "@/hooks/useQuestions";
import { useAuth } from "@/services/auth";
import { pushAnswer } from "@/services/learningSync";
import { conceptsForQuestion } from "@/features/learning/concepts";
import { CONFIDENCE_LABEL, verdictFor, type Confidence } from "@/features/learning/fsrs";
import { dueConcepts, useLearning } from "@/features/learning/store";
import { useConceptQuestions, useDiagnosticQuestions } from "@/features/learning/useConceptQuestions";
import ConfidencePicker from "@/features/learning/ConfidencePicker";
import { DIAGNOSTIC_DONE_KEY, levelFromDiagnostic } from "@/features/learning/diagnosis";
import { runSnippet } from "@/features/challenges/engine/runner";
import QuestionCard from "@/components/ui/QuestionCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { InlineCode } from "@/components/quiz/RichText";
import { langFromTopic, OPTION_LETTERS } from "@/components/quiz/richText";
import { getStoredExperienceLevel, setStoredExperienceLevel, upsertUserExperience } from "@/services/feedback";
import { hapticFeedback } from "@/services/haptics";
import { quizKey, useQuizSession } from "@/store/quizSession";

const LEVEL_LABEL: Record<string, string> = {
	junior: "Junior",
	semi_senior: "Semi senior",
	senior: "Senior",
};

export type QuizMode = "quiz" | "repaso" | "diagnostico";

const MODE_LABEL: Record<QuizMode, string> = { quiz: "", repaso: "Repaso", diagnostico: "Diagnóstico" };

export default function QuizRunner({ mode = "quiz" }: { mode?: QuizMode }) {
	const params = useParams();
	const subcategory = mode === "quiz" ? params.subcategory : undefined;
	const category = mode === "quiz" ? (params.category ?? "") : mode;
	const { user } = useAuth();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const reduceMotion = useReducedMotion();

	const requested = Number(searchParams.get("count"));
	const defaultCount = mode === "repaso" ? 12 : mode === "diagnostico" ? 8 : 5;
	const count =
		Number.isFinite(requested) && requested > 0 ? Math.min(requested, 50) : defaultCount;
	const level = getStoredExperienceLevel() ?? "junior";
	const decodedSubcategory = subcategory ? safeDecode(subcategory) : undefined;

	// Repaso: conceptos pedidos (?conceptos=a,b) o los que vencen hoy
	const cards = useLearning((s) => s.cards);
	const [reviewIds] = useState<string[]>(() => {
		const asked = searchParams.get("conceptos");
		if (asked) return asked.split(",").filter(Boolean);
		return dueConcepts(cards).slice(0, 6).map((c) => c.conceptId);
	});
	const key =
		mode === "quiz"
			? quizKey(category, decodedSubcategory, count, level)
			: [mode, reviewIds.join(","), count, new Date().toDateString()].join("|");

	const session = useQuizSession();
	const resumable =
		session.key === key &&
		session.questions.length > 0 &&
		session.index < session.questions.length;

	const [reloadKey, setReloadKey] = useState(0);
	// Al terminar se limpia la sesión: no hay que arrancar otra antes de salir
	const finished = useRef(false);
	const byCategory = useQuestions(
		mode === "quiz" ? category : undefined,
		count,
		subcategory,
		level,
		reloadKey,
		mode === "quiz" && !resumable && !finished.current,
	);
	const byConcept = useConceptQuestions(reviewIds, count, mode === "repaso" && !resumable, reloadKey);
	const diagnostic = useDiagnosticQuestions(count, mode === "diagnostico" && !resumable, reloadKey);
	const { questions, loading, error } = mode === "repaso" ? byConcept : mode === "diagnostico" ? diagnostic : byCategory;

	// Arranca una sesión nueva cuando llegan preguntas frescas
	useEffect(() => {
		if (!resumable && questions.length > 0 && !finished.current) {
			session.start(key, { category, subcategory: decodedSubcategory }, questions);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- solo al recibir preguntas
	}, [questions]);

	const [selected, setSelected] = useState<string | null>(null);
	const [confidence, setConfidence] = useState<Confidence>("creo");
	const [showExplanation, setShowExplanation] = useState(true);
	const [run, setRun] = useState<{ running: boolean; lines?: string[]; error?: string } | null>(null);
	const [confirmExit, setConfirmExit] = useState(false);

	const current = resumable ? session.questions[session.index] : undefined;
	const total = session.questions.length;
	const checked = resumable && session.answers.length > session.index;
	const answer = checked ? session.answers[session.index] : undefined;
	const chosen = answer?.selectedAnswer ?? selected;
	const isCorrect = answer ? answer.selectedAnswer === answer.correctAnswer : false;
	const isLast = session.index + 1 >= total;
	const lang = useMemo(
		() => (current?.kind === "predict" ? "javascript" : langFromTopic(current?.subcategory ?? decodedSubcategory, current?.category ?? category)),
		[current, decodedSubcategory, category],
	);
	const concepts = useMemo(
		() =>
			current
				? conceptsForQuestion({
						concepts: current.concepts,
						category: current.category ?? category,
						subcategory: current.subcategory ?? decodedSubcategory,
					})
				: [],
		[current, category, decodedSubcategory],
	);

	// Al cambiar de pregunta, limpiar la selección local
	useEffect(() => {
		setSelected(null);
		setConfidence("creo");
		setShowExplanation(true);
		setRun(null);
	}, [session.index, session.key]);

	const check = useCallback(() => {
		if (!current || !selected || checked) return;
		const correct = selected === current.correctAnswer;
		// Repaso espaciado: cada respuesta actualiza la tarjeta de sus conceptos
		const record = { questionId: current.id, chosen: selected, correct, confidence, concepts };
		const learned = useLearning.getState().recordAnswer(record);
		if (user) void pushAnswer(user.id, record, learned.cards, useLearning.getState().streak);
		session.answer({
			question: current.question,
			options: current.options,
			correctAnswer: current.correctAnswer,
			selectedAnswer: selected,
			subcategory: current.subcategory ?? decodedSubcategory,
			shortExplanation: current.shortExplanation,
			sourceUrl: current.sourceUrl,
			sourceName: current.sourceName,
			questionId: current.id,
			confidence,
			concepts,
			returns: learned.returns,
		});
		void hapticFeedback(correct ? "success" : "error");
	}, [current, selected, checked, session, decodedSubcategory, confidence, concepts, user]);

	const execute = useCallback(async () => {
		if (!current?.code) return;
		setRun({ running: true });
		const res = await runSnippet(current.code);
		setRun({ running: false, lines: res.lines, error: res.error });
	}, [current]);

	const goNext = useCallback(() => {
		if (!checked) return;
		if (!isLast) {
			session.next();
			return;
		}
		const summary = session.answers;
		const score = summary.filter((a) => a.selectedAnswer === a.correctAnswer).length;
		let diagnosticLevel: string | undefined;
		if (mode === "diagnostico") {
			const lvl = levelFromDiagnostic(score, summary.length);
			diagnosticLevel = lvl;
			setStoredExperienceLevel(lvl);
			try {
				localStorage.setItem(DIAGNOSTIC_DONE_KEY, new Date().toISOString());
			} catch {
				// sin almacenamiento
			}
			if (user) void upsertUserExperience(user.id, lvl).catch((e) => console.warn("No se pudo guardar el nivel:", e));
		}
		finished.current = true;
		navigate("/result", {
			state: {
				score,
				total: summary.length,
				category,
				subcategory: decodedSubcategory,
				summary,
				bestStreak: session.bestStreak,
				mode,
				diagnosticLevel,
			},
		});
		session.reset();
	}, [checked, isLast, session, navigate, category, decodedSubcategory, mode, user]);

	// Atajos de teclado, solo mientras esta pantalla está montada
	useEffect(() => {
		if (!current) return;
		const onKey = (e: KeyboardEvent) => {
			if (confirmExit || e.altKey || e.ctrlKey || e.metaKey) return;
			const target = e.target as HTMLElement | null;
			if (target?.closest("input, textarea, select, [contenteditable=true]")) return;

			const key = e.key.toUpperCase();
			const byNumber = /^[1-9]$/.test(key) ? Number(key) - 1 : -1;
			const byLetter = OPTION_LETTERS.indexOf(key);
			const idx = byNumber >= 0 ? byNumber : byLetter;

			if (!checked && idx >= 0 && idx < current.options.length && key !== "E") {
				e.preventDefault();
				setSelected(current.options[idx]);
			} else if (e.key === "Enter") {
				// Si el foco está en otro botón (p. ej. "Salir"), que actúe ese botón
				if (target?.tagName === "BUTTON" && target.getAttribute("role") !== "radio") return;
				e.preventDefault();
				if (checked) goNext();
				else check();
			} else if (key === "E" && checked) {
				e.preventDefault();
				setShowExplanation((v) => !v);
			} else if (e.key === "Escape") {
				setConfirmExit(true);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [current, checked, check, goNext, confirmExit]);

	if (!category) return <p className="p-6 text-center">Categoría no especificada.</p>;
	if (mode === "repaso" && reviewIds.length === 0 && !resumable) {
		return (
			<section className="mx-auto max-w-md space-y-3 px-4 py-16 text-center">
				<h1 className="font-display text-2xl font-bold">No tienes repasos pendientes</h1>
				<p className="text-muted">Responde algún quiz: los conceptos que falles o adivines volverán aquí cuando toque.</p>
			</section>
		);
	}

	if (!resumable && (loading || questions.length > 0)) {
		return <p className="p-6 text-center text-muted">Cargando preguntas...</p>;
	}
	if (error) {
		return (
			<div className="space-y-3 p-6 text-center">
				<p className="text-warn">{error}</p>
				<button
					type="button"
					className="min-h-touch rounded-md bg-accent px-4 py-2 font-semibold text-accent-fg hover:bg-accent/90"
					onClick={() => setReloadKey((k) => k + 1)}
				>
					Reintentar
				</button>
			</div>
		);
	}
	if (!current) return <p className="p-6 text-center">No se encontraron preguntas.</p>;

	const progress = Math.round(((session.index + (checked ? 1 : 0)) / total) * 100);
	const context = [
		mode === "quiz" ? capitalize(category) : MODE_LABEL[mode],
		concepts.length ? concepts.map((c) => c.name).join(", ") : decodedSubcategory,
		LEVEL_LABEL[current.difficulty ?? level] ?? undefined,
	]
		.filter(Boolean)
		.join(" · ");

	return (
		<div className="mx-auto flex min-h-[calc(100dvh-4.5rem)] w-full max-w-3xl flex-col px-4 pb-28 pt-4 sm:px-6">
			{/* Barra superior: salir, progreso y racha */}
			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={() => setConfirmExit(true)}
					aria-label="Salir del quiz"
					className="flex min-h-touch min-w-touch items-center justify-center rounded-md text-muted hover:bg-surface2 hover:text-fg"
				>
					<X className="h-5 w-5" aria-hidden="true" />
				</button>
				<div className="flex-1">
					<div className="mb-1.5 flex items-center justify-between text-sm">
						<span className="font-semibold" aria-live="polite">
							Pregunta {session.index + 1} de {total}
						</span>
						<StreakBadge streak={session.streak} reduceMotion={!!reduceMotion} />
					</div>
					<div
						className="h-1.5 w-full overflow-hidden rounded-full bg-surface2"
						role="progressbar"
						aria-label="Progreso del quiz"
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={progress}
					>
						<div
							className="h-full rounded-full bg-accent transition-[width] duration-300"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>
			</div>

			<p className="mt-5 w-fit rounded-full border border-line bg-surface2 px-3 py-1 font-mono text-xs text-muted">
				{context}
			</p>

			<div className="mt-4">
				<QuestionCard
					question={current.question}
					code={current.code}
					options={current.options}
					lang={lang}
					selected={chosen}
					checked={checked}
					correctAnswer={current.correctAnswer}
					onSelect={setSelected}
				/>
			</div>

			{/* Confianza (antes de comprobar) o feedback (después) */}
			{!checked && (
				<div className="mt-5">
					<ConfidencePicker value={confidence} onChange={setConfidence} />
				</div>
			)}
			<div aria-live="polite" className="mt-5">
				<AnimatePresence>
					{checked && answer && (
						<m.section
							initial={reduceMotion ? false : { opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							className={`space-y-3 rounded-xl border p-4 ${isCorrect ? "border-accent/50 bg-accent-softer" : "border-warn/50 bg-warn-soft"}`}
						>
							<div>
								<p className={`font-display text-lg font-bold ${isCorrect ? "text-accent" : "text-warn"}`}>
									{verdictFor(isCorrect, answer.confidence ?? "creo").text}
								</p>
								<p className="text-sm text-muted">
									Tu confianza: {CONFIDENCE_LABEL[answer.confidence ?? "creo"]}
									{!isCorrect && (
										<>
											{" "}
											· La correcta es la{" "}
											<strong className="text-fg">{OPTION_LETTERS[current.options.indexOf(current.correctAnswer)]}</strong>
										</>
									)}
								</p>
							</div>
							{!isCorrect && current.optionMeta?.[answer.selectedAnswer]?.whyTempting && (
								<p className="text-sm">
									<strong>Por qué era tentadora:</strong> {current.optionMeta[answer.selectedAnswer]?.whyTempting}
								</p>
							)}
							{current.shortExplanation && (
								<div>
									<button
										type="button"
										onClick={() => setShowExplanation((v) => !v)}
										aria-expanded={showExplanation}
										className="inline-flex min-h-touch items-center gap-2 text-sm font-semibold text-accent hover:text-accent/80"
									>
										<BookOpen className="h-4 w-4" aria-hidden="true" />
										{showExplanation ? "Ocultar explicación" : "Ver explicación"}
										<kbd className="rounded border border-line bg-surface px-1.5 font-mono text-[0.7rem] text-muted">E</kbd>
									</button>
									{showExplanation && (
										<div className="mt-1 space-y-2 text-sm leading-relaxed">
											<p>
												<InlineCode text={current.shortExplanation} />
											</p>
											{current.sourceUrl && (
												<a
													href={current.sourceUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center gap-1 text-accent underline"
												>
													Saber más en {current.sourceName || "la fuente"}
													<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
												</a>
											)}
										</div>
									)}
								</div>
							)}
							{run && (
								<div className="rounded-lg border border-line bg-surface p-3 font-mono text-sm" aria-label="Salida real">
									<p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted">Consola</p>
									{run.running ? (
										<p className="text-muted">Ejecutando…</p>
									) : (
										<>
											{run.lines?.filter((l, i, all) => l !== "" || all.length > 1).map((l, i) => (
												<p key={i}>
													<span className="text-muted" aria-hidden="true">› </span>
													{l === "" ? <span className="text-muted">(vacío)</span> : l}
												</p>
											))}
											{run.error && <p className="text-warn">{run.error}</p>}
										</>
									)}
								</div>
							)}
							{answer.returns && answer.concepts && answer.concepts.length > 0 && (
								<p className="flex items-center gap-1.5 text-sm text-muted">
									<Repeat className="h-4 w-4 shrink-0" aria-hidden="true" />
									{answer.concepts.map((c) => c.name).join(", ")} vuelve a tu repaso {answer.returns}.
								</p>
							)}
						</m.section>
					)}
				</AnimatePresence>
			</div>

			{/* Pie fijo con la acción principal */}
			<div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur">
				<div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
					<p className="hidden text-xs text-muted sm:block">
						<kbd className="font-mono">1-4</kbd> elegir ·{" "}
						<kbd className="font-mono">Enter</kbd> {checked ? "seguir" : "comprobar"}
						{checked && (
							<>
								{" "}
								· <kbd className="font-mono">E</kbd> explicación
							</>
						)}
					</p>
					{checked && current.kind === "predict" && current.code && (
						<button
							type="button"
							onClick={() => void execute()}
							disabled={run?.running}
							className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-line bg-surface2 px-4 font-semibold hover:border-accent/60 disabled:opacity-60 sm:ml-auto"
						>
							{run?.running ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
							Ejecutar
						</button>
					)}
					<button
						type="button"
						onClick={checked ? goNext : check}
						disabled={!checked && !selected}
						className={`${checked && current.kind === "predict" ? "" : "ml-auto"} inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-6 font-semibold text-accent-fg transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-surface2 disabled:text-muted sm:flex-none`}
					>
						{checked ? (isLast ? "Ver resultados" : "Siguiente") : "Comprobar"}
						<kbd aria-hidden="true" className="hidden rounded border border-current px-1.5 font-mono text-[0.7rem] sm:inline">
							Enter
						</kbd>
					</button>
				</div>
			</div>

			<ConfirmDialog
				open={confirmExit}
				title="¿Salir del quiz?"
				description="Tu progreso queda guardado: si vuelves a este quiz, continuarás donde lo dejaste."
				onClose={() => setConfirmExit(false)}
				actions={[
					{ label: "Seguir respondiendo", variant: "primary", onClick: () => setConfirmExit(false) },
					{ label: "Salir", onClick: () => navigate("/") },
					{
						label: "Empezar de nuevo",
						variant: "ghost",
						onClick: () => {
							session.reset();
							setConfirmExit(false);
							setReloadKey((k) => k + 1);
						},
					},
				]}
			/>
		</div>
	);
}

function StreakBadge({ streak, reduceMotion }: { streak: number; reduceMotion: boolean }) {
	// La llama se "enciende" (más intensa) a medida que crece la racha
	const intensity = Math.min(streak, 5) / 5;
	return (
		<m.span
			key={streak}
			initial={reduceMotion || streak === 0 ? false : { scale: 1.35 }}
			animate={{ scale: 1 }}
			className="inline-flex items-center gap-1 font-mono text-xs font-semibold"
			style={{ color: streak > 0 ? "rgb(var(--warn))" : "rgb(var(--muted))" }}
			aria-label={`Racha de ${streak} aciertos`}
		>
			<Flame
				className="h-4 w-4"
				aria-hidden="true"
				style={{ opacity: 0.45 + intensity * 0.55 }}
				fill={streak > 0 ? "currentColor" : "none"}
				fillOpacity={0.2 + intensity * 0.6}
			/>
			racha ×{streak}
		</m.span>
	);
}

function capitalize(s: string) {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

function safeDecode(value: string) {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}
