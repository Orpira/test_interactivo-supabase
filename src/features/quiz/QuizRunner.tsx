import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { BookOpen, ExternalLink, Flame, X } from "lucide-react";
import { useQuestions } from "@/hooks/useQuestions";
import QuestionCard from "@/components/ui/QuestionCard";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { InlineCode } from "@/components/quiz/RichText";
import { langFromTopic, OPTION_LETTERS } from "@/components/quiz/richText";
import { getStoredExperienceLevel } from "@/services/feedback";
import { hapticFeedback } from "@/services/haptics";
import { quizKey, useQuizSession } from "@/store/quizSession";

const LEVEL_LABEL: Record<string, string> = {
	junior: "Junior",
	semi_senior: "Semi senior",
	senior: "Senior",
};

export default function QuizRunner() {
	const { category = "", subcategory } = useParams();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const reduceMotion = useReducedMotion();

	const requested = Number(searchParams.get("count"));
	const count =
		Number.isFinite(requested) && requested > 0 ? Math.min(requested, 50) : 5;
	const level = getStoredExperienceLevel() ?? "junior";
	const decodedSubcategory = subcategory ? safeDecode(subcategory) : undefined;
	const key = quizKey(category, decodedSubcategory, count, level);

	const session = useQuizSession();
	const resumable =
		session.key === key &&
		session.questions.length > 0 &&
		session.index < session.questions.length;

	const [reloadKey, setReloadKey] = useState(0);
	const { questions, loading, error } = useQuestions(
		category,
		count,
		subcategory,
		level,
		reloadKey,
		!resumable,
	);

	// Arranca una sesión nueva cuando llegan preguntas frescas
	useEffect(() => {
		if (!resumable && questions.length > 0) {
			session.start(key, { category, subcategory: decodedSubcategory }, questions);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- solo al recibir preguntas
	}, [questions]);

	const [selected, setSelected] = useState<string | null>(null);
	const [showExplanation, setShowExplanation] = useState(false);
	const [confirmExit, setConfirmExit] = useState(false);

	const current = resumable ? session.questions[session.index] : undefined;
	const total = session.questions.length;
	const checked = resumable && session.answers.length > session.index;
	const answer = checked ? session.answers[session.index] : undefined;
	const chosen = answer?.selectedAnswer ?? selected;
	const isCorrect = answer ? answer.selectedAnswer === answer.correctAnswer : false;
	const isLast = session.index + 1 >= total;
	const lang = useMemo(
		() => langFromTopic(decodedSubcategory, category),
		[decodedSubcategory, category],
	);

	// Al cambiar de pregunta, limpiar la selección local
	useEffect(() => {
		setSelected(null);
		setShowExplanation(false);
	}, [session.index, session.key]);

	const check = useCallback(() => {
		if (!current || !selected || checked) return;
		const correct = selected === current.correctAnswer;
		session.answer({
			question: current.question,
			options: current.options,
			correctAnswer: current.correctAnswer,
			selectedAnswer: selected,
			subcategory: decodedSubcategory,
			shortExplanation: current.shortExplanation,
			sourceUrl: current.sourceUrl,
			sourceName: current.sourceName,
		});
		void hapticFeedback(correct ? "success" : "error");
		if (!correct && current.shortExplanation) setShowExplanation(true);
	}, [current, selected, checked, session, decodedSubcategory]);

	const goNext = useCallback(() => {
		if (!checked) return;
		if (!isLast) {
			session.next();
			return;
		}
		const summary = session.answers;
		const score = summary.filter((a) => a.selectedAnswer === a.correctAnswer).length;
		navigate("/result", {
			state: {
				score,
				total: summary.length,
				category,
				subcategory: decodedSubcategory,
				summary,
				bestStreak: session.bestStreak,
			},
		});
		session.reset();
	}, [checked, isLast, session, navigate, category, decodedSubcategory]);

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
		capitalize(category),
		decodedSubcategory,
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
					options={current.options}
					lang={lang}
					selected={chosen}
					checked={checked}
					correctAnswer={current.correctAnswer}
					onSelect={setSelected}
				/>
			</div>

			{/* Panel de feedback tras comprobar */}
			<div aria-live="polite" className="mt-5">
				<AnimatePresence>
					{checked && (
						<m.section
							initial={reduceMotion ? false : { opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							className={`rounded-xl border p-4 ${isCorrect ? "border-accent/50 bg-accent-softer" : "border-warn/50 bg-warn-soft"}`}
						>
							<p className={`font-display text-lg font-bold ${isCorrect ? "text-accent" : "text-warn"}`}>
								{isCorrect ? "¡Correcto!" : "No es correcta"}
							</p>
							{!isCorrect && (
								<p className="mt-1 text-sm">
									La respuesta correcta es la{" "}
									<strong>
										{OPTION_LETTERS[current.options.indexOf(current.correctAnswer)]}
									</strong>
									.
								</p>
							)}
							{current.shortExplanation && (
								<>
									<button
										type="button"
										onClick={() => setShowExplanation((v) => !v)}
										aria-expanded={showExplanation}
										className="mt-3 inline-flex min-h-touch items-center gap-2 text-sm font-semibold text-accent hover:text-accent/80"
									>
										<BookOpen className="h-4 w-4" aria-hidden="true" />
										{showExplanation ? "Ocultar explicación" : "Ver explicación"}
										<kbd className="rounded border border-line bg-surface px-1.5 font-mono text-[0.7rem] text-muted">
											E
										</kbd>
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
								</>
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
					<button
						type="button"
						onClick={checked ? goNext : check}
						disabled={!checked && !selected}
						className="ml-auto inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 font-semibold text-accent-fg transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-surface2 disabled:text-muted sm:w-auto"
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
