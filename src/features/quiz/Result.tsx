import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "../../services/auth";
import { supabase } from "../../services/supabase";
import { updateUserStats } from "../../services/userStats";
import { m, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { conceptsForQuestion, type ConceptRef } from "@/features/learning/concepts";
import { CONFIDENCE_LABEL, returnsLabel, type Confidence } from "@/features/learning/fsrs";
import { calibration, diagnosisHeadline, overconfidentCount, splitConcepts, type GradedAnswer } from "@/features/learning/diagnosis";
import { useLearning } from "@/features/learning/store";
import type { AnswerResume } from "@/types/TestResult";
import ExperienceFeedbackModal from "@/components/ui/ExperienceFeedbackModal";
import {
	canUserSendFeedback,
	fetchUserExperienceLevel,
	getStoredExperienceLevel,
	saveQuizFeedback,
	type ExperienceLevel,
} from "@/services/feedback";

type Props = { answers?: AnswerResume[] };

type SummaryEntry = {
	question: string;
	options: string[];
	correctAnswer: string;
	selectedAnswer: string;
	subcategory?: string;
	shortExplanation?: string;
	sourceUrl?: string;
	sourceName?: string;
	confidence?: Confidence;
	concepts?: ConceptRef[];
};

export default function Result({ answers: answersProp }: Props) {
	const location = useLocation();
	const navigate = useNavigate();
	const { isAuthenticated, user } = useAuth();
	const hasSaved = useRef(false);
	const [loadingFromDB, setLoadingFromDB] = useState(false);
	const [dbSummary, setDbSummary] = useState<SummaryEntry[] | null>(null);
	const [dbScore, setDbScore] = useState<number | undefined>();
	const [dbTotal, setDbTotal] = useState<number | undefined>();
	const [dbCategory, setDbCategory] = useState<string | undefined>();
	const [dbSubcategory, setDbSubcategory] = useState<string | undefined>();
	const [dbError, setDbError] = useState<string | null>(null);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [feedbackOpen, setFeedbackOpen] = useState(false);
	const [feedbackLoading, setFeedbackLoading] = useState(false);
	const [feedbackError, setFeedbackError] = useState<string | null>(null);
	const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
		() => getStoredExperienceLevel() ?? "junior"
	);
	const feedbackChecked = useRef(false);
	const [showFailed, setShowFailed] = useState(false);
	const learningCards = useLearning((st) => st.cards);
	const markPerfectCalibration = useLearning((st) => st.markPerfectCalibration);

	// Leer id desde query params (?id=xxx)
	const searchParams = new URLSearchParams(location.search);
	const resultId = searchParams.get("id");

	const state = location.state as {
		score?: number;
		total?: number;
		category?: string;
		subcategory?: string;
		summary?: SummaryEntry[];
		mode?: "quiz" | "repaso" | "diagnostico";
		diagnosticLevel?: string;
	} | null;

	// Logro "Calibración perfecta": ≥5 respuestas "Seguro" en un quiz, todas acertadas
	useEffect(() => {
		const sure = (state?.summary ?? []).filter((a) => a.confidence === "seguro");
		if (sure.length >= 5 && sure.every((a) => a.selectedAnswer === a.correctAnswer)) markPerfectCalibration();
	}, [state?.summary, markPerfectCalibration]);

	// Cargar resultado desde Supabase si viene con ?id=
	useEffect(() => {
		if (resultId) {
			setLoadingFromDB(true);
			setDbError(null);
			supabase
				.from("resultados")
				.select("*")
				.eq("id", resultId)
				.single()
				.then(({ data, error }) => {
					if (error) {
						setDbError(error.message || "No se pudo cargar el resultado.");
					}
					if (data) {
						setDbSummary(data.summary);
						setDbScore(data.score);
						setDbTotal(data.total);
						setDbCategory(data.category);
						setDbSubcategory(data.subcategory ?? data.subcategoria);
					}
					setLoadingFromDB(false);
				});
		}
	}, [resultId]);

	const activeSummary = state?.summary ?? dbSummary;

	// Construir answers desde props, location.state, o DB
	const answers: AnswerResume[] =
		answersProp && answersProp.length > 0
			? answersProp
			: (activeSummary ?? []).map((s, i) => ({
					id: String(i),
					question: s.question,
					userAnswer: s.selectedAnswer,
					correctAnswer: s.correctAnswer,
					correct: s.selectedAnswer === s.correctAnswer,
					shortExplanation: s.shortExplanation ?? "",
					sourceUrl: s.sourceUrl ?? "",
					sourceName: s.sourceName ?? "",
			  }));

	const finalScore = state?.score ?? dbScore;
	const finalTotal = state?.total ?? dbTotal;
	const finalCategory = state?.category ?? dbCategory;
	const finalSubcategory =
		state?.subcategory ??
		state?.summary?.[0]?.subcategory ??
		dbSubcategory ??
		dbSummary?.[0]?.subcategory;

	// Cargar nivel de experiencia desde Supabase si el usuario está autenticado
	useEffect(() => {
		if (user?.id) {
			fetchUserExperienceLevel(user.id)
				.then((level) => {
					if (level) setExperienceLevel(level);
				})
				.catch(() => {});
		}
	}, [user]);

	// Guardar resultado en Supabase (solo cuando viene del quiz, no desde ?id=)
	useEffect(() => {
		if (
			!resultId &&
			isAuthenticated &&
			user &&
			typeof finalScore === "number" &&
			typeof finalTotal === "number" &&
			finalCategory &&
			finalTotal > 0 &&
			!hasSaved.current
		) {
			hasSaved.current = true;
			const resultado = {
				// No guardamos el email: la tabla resultados alimenta el ranking público.
				name: getPublicDisplayName(user),
				userId: user.id,
				score: finalScore,
				total: finalTotal,
				category: String(finalCategory),
				subcategory: finalSubcategory ?? null,
				summary: state?.summary ?? null,
				timestamp: new Date().toISOString(),
			};
			supabase
				.from("resultados")
				.insert(resultado)
				.select("id")
				.single()
				.then(({ data, error }) => {
					if (error) {
						console.error("Error guardando resultado:", error);
						setSaveError(
							error.message || "No se pudo guardar el resultado del quiz."
						);
						return;
					}
					// Fijamos la URL con el id: al recargar no se vuelve a insertar
					// el resultado y el enlace se puede compartir.
					if (data?.id) {
						navigate(`/result?id=${data.id}`, {
							replace: true,
							state: location.state,
						});
					}
				});
			updateUserStats(user, finalCategory, finalScore, finalTotal);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- guardado único, protegido por hasSaved
	}, [
		isAuthenticated,
		user,
		finalScore,
		finalTotal,
		finalCategory,
		finalSubcategory,
	]);

	// Mostrar feedback solo al finalizar quiz nuevo y si pasó la ventana de 7 días.
	useEffect(() => {
		if (feedbackChecked.current) {
			return;
		}

		if (
			!resultId &&
			isAuthenticated &&
			user?.id &&
			typeof finalTotal === "number" &&
			finalTotal > 0
		) {
			feedbackChecked.current = true;
			canUserSendFeedback(user.id)
				.then((canSend) => {
					if (canSend) {
						setFeedbackOpen(true);
					}
				})
				.catch((error) => {
					console.error("No se pudo validar feedback:", error);
				});
		}
	}, [resultId, isAuthenticated, user, finalTotal]);

	const handleSubmitFeedback = async (payload: {
		rating: number;
		comment: string;
		reason?: "dificultad" | "claridad" | "errores_tecnicos" | "desactualizado";
	}) => {
		if (!user?.id) {
			setFeedbackOpen(false);
			return;
		}

		try {
			setFeedbackLoading(true);
			setFeedbackError(null);
			await saveQuizFeedback({
				userId: user.id,
				experienceLevel,
				rating: payload.rating,
				comment: payload.comment,
				reason: payload.reason,
				quizId: resultId ?? undefined,
			});
			setFeedbackOpen(false);
		} catch (error) {
			setFeedbackError(
				(error as { message?: string })?.message ||
					"No se pudo enviar tu evaluación. Intenta de nuevo."
			);
		} finally {
			setFeedbackLoading(false);
		}
	};

	if (loadingFromDB) {
		return <p className="p-6 text-center">Cargando resultado...</p>;
	}

	if (dbError) {
		return <p className="p-6 text-center text-warn">{dbError}</p>;
	}

	if (!answers || answers.length === 0) {
		return (
			<section className="max-w-2xl mx-auto px-4 py-8 space-y-6">
				<h1 className="text-3xl font-bold text-center mb-8">Resultados</h1>
				<p className="text-center text-warn">
					No hay respuestas disponibles.
				</p>
			</section>
		);
	}

	const correctCount = answers.filter((a) => a.correct).length;
	const scoreToShow = finalScore ?? correctCount;
	const totalToShow = finalTotal ?? answers.length;
	const percentage = totalToShow > 0 ? Math.round((scoreToShow / totalToShow) * 100) : 0;

	// Diagnóstico por conceptos y confianza (resultados antiguos: "Creo que sí")
	const graded: GradedAnswer[] = (activeSummary ?? []).map((s) => ({
		correct: s.selectedAnswer === s.correctAnswer,
		confidence: s.confidence ?? "creo",
		concepts: s.concepts?.length ? s.concepts : conceptsForQuestion({ category: finalCategory, subcategory: s.subcategory ?? finalSubcategory }),
	}));
	const split = splitConcepts(graded);
	const overconfident = overconfidentCount(graded);
	const calib = calibration(graded);
	const seguro = calib[0];
	const headline = diagnosisHeadline(split, overconfident);
	const failed = answers.filter((a) => !a.correct);
	const conceptIds = [...new Set(graded.flatMap((g) => g.concepts.map((c) => c.id)))];
	const tomorrow = conceptIds.filter((id) => {
		const card = learningCards[id];
		return card && returnsLabel(card.due) === "mañana";
	}).length;
	const weakest = split.weak[0];
	const recommended = weakest
		? { label: `Repasar ${weakest.name}`, detail: "5 preguntas · unos 3 min", to: `/repaso?conceptos=${encodeURIComponent(weakest.id)}&count=5` }
		: { label: "Abrir la incidencia del día", detail: "Depura un bug real · ~10 min", to: "/hoy" };
	const modeLabel = state?.mode === "diagnostico" ? "DIAGNÓSTICO" : state?.mode === "repaso" ? "REPASO" : "QUIZ";
	const area = (finalSubcategory ?? (state?.mode && state.mode !== "quiz" ? "" : finalCategory) ?? "").toUpperCase();

	return (
		<>
			<section className="mx-auto w-full max-w-2xl space-y-5 px-4 pb-48 pt-6 sm:px-6">
				<div className="flex items-center justify-between gap-3">
					<p className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">
						{modeLabel} COMPLETADO{area ? ` · ${area}` : ""}
					</p>
					<span className="rounded-full border border-line bg-surface2 px-2.5 py-0.5 font-mono text-sm font-semibold">
						{scoreToShow}/{totalToShow}
					</span>
				</div>
				{saveError && <p className="rounded border border-warn/40 bg-warn-soft p-2 text-sm text-warn">{saveError}</p>}
				<div>
					<h1 className="font-display text-2xl font-bold leading-tight sm:text-3xl">{headline}</h1>
					<p className="mt-1 text-sm text-muted">
						{scoreToShow} / {totalToShow} ({percentage}%){finalCategory && state?.mode !== "repaso" && state?.mode !== "diagnostico" ? ` · ${finalCategory}` : ""}
					</p>
					{state?.diagnosticLevel && (
						<p className="mt-2 rounded-lg border border-accent/40 bg-accent-soft px-3 py-2 text-sm">
							Tu nivel de partida: <strong>{LEVEL_NAME[state.diagnosticLevel] ?? state.diagnosticLevel}</strong>. Lo usaremos para elegir tus preguntas; puedes cambiarlo cuando quieras.
						</p>
					)}
				</div>

				<section aria-labelledby="calibracion" className="rounded-xl border border-line bg-surface p-4">
					<h2 id="calibracion" className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">
						Calibración
					</h2>
					<ul className="mt-3 space-y-2.5">
						{calib.map((row) => {
							const bad = row.confidence === "seguro" && row.correct < row.total;
							return (
								<li key={row.confidence} className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-3 text-sm">
									<span className={bad ? "font-semibold text-warn" : ""}>{CONFIDENCE_LABEL[row.confidence]}</span>
									<span
										className="h-2 overflow-hidden rounded-full bg-surface2"
										role="img"
										aria-label={`${CONFIDENCE_LABEL[row.confidence]}: ${row.total ? `${row.pct}% de aciertos` : "sin respuestas"}`}
									>
										<span className={`block h-full rounded-full ${bad ? "bg-warn" : "bg-accent"}`} style={{ width: `${row.pct}%` }} />
									</span>
									<span className={`text-right font-mono ${bad ? "text-warn" : "text-muted"}`}>
										{row.correct}/{row.total}
									</span>
								</li>
							);
						})}
					</ul>
					{overconfident > 0 && (
						<p className="mt-3 text-sm text-warn">
							Ojo: fallaste {overconfident} de las {seguro.total} que marcaste como «Seguro». Son las que más conviene repasar.
						</p>
					)}
				</section>

				<div className="grid gap-3 sm:grid-cols-2">
					<section aria-labelledby="dominados" className="rounded-xl border border-accent/40 bg-accent-softer p-4">
						<h2 id="dominados" className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">
							Dominados
						</h2>
						<ul className="mt-2 space-y-1 font-mono text-sm">
							{split.strong.length ? split.strong.map((c) => <li key={c.id}>{c.name}</li>) : <li className="text-muted">Aún ninguno</li>}
						</ul>
					</section>
					<section aria-labelledby="reforzar" className="rounded-xl border border-warn/40 bg-warn-soft p-4">
						<h2 id="reforzar" className="font-mono text-xs font-semibold uppercase tracking-widest text-warn">
							A reforzar
						</h2>
						<ul className="mt-2 space-y-1 font-mono text-sm">
							{split.weak.length ? split.weak.map((c) => <li key={c.id}>{c.name}</li>) : <li className="text-muted">Nada por ahora 🎉</li>}
						</ul>
					</section>
				</div>

				{failed.length > 0 && (
					<section>
						<button
							type="button"
							onClick={() => setShowFailed((v) => !v)}
							aria-expanded={showFailed}
							aria-controls="falladas"
							className="flex min-h-touch w-full items-center justify-between rounded-xl border border-line bg-surface px-4 font-semibold hover:border-accent/60"
						>
							Revisar las {failed.length} falladas
							<ChevronDown className={`h-5 w-5 transition-transform ${showFailed ? "rotate-180" : ""}`} aria-hidden="true" />
						</button>
						{showFailed && (
							<div id="falladas" className="mt-3 space-y-3">
								{failed.map((ans) => (
									<ResultItem key={ans.id} data={ans} concept={conceptOf(ans.id)} />
								))}
							</div>
						)}
					</section>
				)}

				<details className="text-sm">
					<summary className="min-h-8 cursor-pointer text-muted hover:text-fg">Ver todas las respuestas</summary>
					<div className="mt-3 space-y-3">
						{answers.map((ans) => (
							<ResultItem key={ans.id} data={ans} concept={conceptOf(ans.id)} />
						))}
					</div>
				</details>
			</section>

			{/* Pie fijo: una única acción recomendada */}
			<div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur">
				<div className="mx-auto flex w-full max-w-2xl flex-col gap-2 sm:flex-row sm:items-center">
					<div className="min-w-0 flex-1">
						<p className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">Siguiente paso recomendado</p>
						<p className="truncate font-semibold">
							{recommended.label} <span className="font-normal text-muted">· {recommended.detail}</span>
						</p>
						{tomorrow > 0 && (
							<p className="text-xs text-muted">
								{tomorrow} {tomorrow === 1 ? "tarjeta añadida" : "tarjetas añadidas"} a tu repaso de mañana
							</p>
						)}
					</div>
					<Link
						to={recommended.to}
						className="inline-flex min-h-12 items-center justify-center rounded-lg bg-accent px-6 font-semibold text-accent-fg hover:bg-accent/90"
					>
						Empezar
					</Link>
				</div>
			</div>
			<ExperienceFeedbackModal
				open={feedbackOpen}
				experienceLevel={experienceLevel}
				loading={feedbackLoading}
				error={feedbackError}
				onClose={() => setFeedbackOpen(false)}
				onSubmit={handleSubmitFeedback}
			/>
		</>
	);

	function conceptOf(id: string) {
		return graded[Number(id)]?.concepts[0]?.name;
	}
}

const LEVEL_NAME: Record<string, string> = { junior: "Junior", semi_senior: "Semi senior", senior: "Senior" };

function getPublicDisplayName(user: User) {
	const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
	if (fullName) return String(fullName);
	return user.email ? user.email.split("@")[0] : "Anónimo";
}

function ResultItem({ data, concept }: { data: AnswerResume; concept?: string }) {
	const [open, setOpen] = useState(false);

	return (
		<article
			className={`
        rounded-xl border shadow
        ${
					data.correct
						? "border-accent/50 bg-accent-soft"
						: "border-warn/50 bg-warn-soft"
				}
      `}
		>
			{/* Cabecera */}
			<button
				type="button"
				className="flex w-full items-center justify-between gap-4 p-4 text-left cursor-pointer"
				onClick={() => setOpen(!open)}
				aria-expanded={open}
			>
				<div>
					{concept && <p className={`font-mono text-xs ${data.correct ? "text-accent" : "text-warn"}`}>{concept}</p>}
					<p className="font-semibold">{data.question}</p>
					<p className="text-sm">
						Tu respuesta:{" "}
						<span
							className={
								data.correct
									? "font-medium text-accent"
									: "font-medium text-warn"
							}
						>
							{data.userAnswer}
						</span>
					</p>
					{!data.correct && (
						<p className="text-sm mt-0.5">
							Respuesta correcta:{" "}
							<span className="font-medium text-accent">
								{data.correctAnswer}
							</span>
						</p>
					)}
				</div>

				{/* Chevron indicador */}
				<svg
					className={`w-6 h-6 shrink-0 transition-transform ${
						open ? "rotate-180" : "rotate-0"
					}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>

			{/* “Persiana” animada */}
			<AnimatePresence initial={false}>
				{open && (
					<m.div
						key="content"
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.25, ease: "easeInOut" }}
						className="overflow-hidden border-t px-4 pb-4"
					>
						<p className="mt-3">{data.shortExplanation}</p>
						{data.sourceUrl && (
							<a
								href={data.sourceUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="mt-2 inline-block text-accent underline text-sm"
							>
								Ver explicación ampliada en {data.sourceName || "la fuente"}
							</a>
						)}
					</m.div>
				)}
			</AnimatePresence>
		</article>
	);
}
