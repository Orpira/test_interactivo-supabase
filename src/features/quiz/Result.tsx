import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../services/auth";
import { supabase } from "../../services/supabase";
import { updateUserStats } from "../../services/userStats";
import { motion, AnimatePresence } from "framer-motion";
import type { AnswerResume } from "@/types/TestResult";

type Props = { answers?: AnswerResume[] };

export default function Result({ answers: answersProp }: Props) {
	const location = useLocation();
	const { isAuthenticated, user } = useAuth();
	const hasSaved = useRef(false);
	const [loadingFromDB, setLoadingFromDB] = useState(false);
	const [dbSummary, setDbSummary] = useState<any[] | null>(null);
	const [dbScore, setDbScore] = useState<number | undefined>();
	const [dbTotal, setDbTotal] = useState<number | undefined>();
	const [dbCategory, setDbCategory] = useState<string | undefined>();
	const [dbSubcategory, setDbSubcategory] = useState<string | undefined>();

	// Leer id desde query params (?id=xxx)
	const searchParams = new URLSearchParams(location.search);
	const resultId = searchParams.get("id");

	const state = location.state as {
		score?: number;
		total?: number;
		category?: string;
		subcategory?: string;
		summary?: {
			question: string;
			options: string[];
			correctAnswer: string;
			selectedAnswer: string;
			subcategory?: string;
			shortExplanation?: string;
			sourceUrl?: string;
			sourceName?: string;
		}[];
	} | null;

	// Cargar resultado desde Supabase si viene con ?id=
	useEffect(() => {
		if (resultId) {
			setLoadingFromDB(true);
			supabase
				.from("resultados")
				.select("*")
				.eq("id", resultId)
				.single()
				.then(({ data, error }) => {
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
			: (activeSummary ?? []).map((s: any, i: number) => ({
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
				name: user.user_metadata?.full_name || "",
				email: user.email || "",
				userId: user.id || "",
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
				.then(({ error }) => {
					if (error) {
						console.error("Error guardando resultado:", error);
					}
				});
			updateUserStats(user, finalCategory, finalScore, finalTotal);
		}
	}, [
		isAuthenticated,
		user,
		finalScore,
		finalTotal,
		finalCategory,
		finalSubcategory,
	]);

	if (loadingFromDB) {
		return <p className="p-6 text-center">Cargando resultado...</p>;
	}

	if (!answers || answers.length === 0) {
		return (
			<section className="max-w-2xl mx-auto px-4 py-8 space-y-6">
				<h1 className="text-3xl font-bold text-center mb-8">Resultados</h1>
				<p className="text-center text-red-600">
					No hay respuestas disponibles.
				</p>
			</section>
		);
	}

	const correctCount = answers.filter((a) => a.correct).length;
	const scoreToShow = finalScore ?? correctCount;
	const totalToShow = finalTotal ?? answers.length;
	const percentage =
		totalToShow > 0 ? Math.round((scoreToShow / totalToShow) * 100) : 0;

	const getMessage = (pct: number) => {
		if (pct === 100)
			return {
				emoji: "🏆",
				text: "¡Perfecto! Eres un crack, dominas este tema por completo.",
			};
		if (pct >= 80)
			return {
				emoji: "🌟",
				text: "¡Excelente trabajo! Estás muy cerca de la perfección.",
			};
		if (pct >= 60)
			return {
				emoji: "💪",
				text: "¡Buen resultado! Sigue practicando y lo dominarás.",
			};
		if (pct >= 40)
			return {
				emoji: "📚",
				text: "¡No te rindas! Cada intento te acerca más al objetivo.",
			};
		return {
			emoji: "🚀",
			text: "¡El camino del aprendizaje empieza aquí! Vuelve a intentarlo, tú puedes.",
		};
	};

	const message = getMessage(percentage);
	const retryQuizLink = finalCategory
		? `/?quizCategory=${encodeURIComponent(finalCategory)}`
		: "/";

	return (
		<section className="max-w-2xl mx-auto px-4 py-8 space-y-6">
			<h1 className="text-3xl font-bold text-center mb-2">Resultados</h1>

			{/* Resumen */}
			<div className="text-center space-y-3 mb-6">
				<p className="text-6xl">{message.emoji}</p>
				<p className="text-2xl font-bold">
					{scoreToShow} / {totalToShow}{" "}
					<span className="text-lg font-normal text-gray-500">
						({percentage}%)
					</span>
				</p>
				{finalCategory && (
					<p className="text-sm text-gray-500">
						Categoría: <strong>{finalCategory}</strong>
					</p>
				)}
				<p className="text-lg text-gray-700 dark:text-gray-300">
					{message.text}
				</p>
				<div className="flex justify-center gap-3 pt-2">
					<Link
						to={retryQuizLink}
						className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
					>
						Intentar otro quiz
					</Link>
					{isAuthenticated && (
						<Link
							to="/dashboard"
							className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition text-sm"
						>
							Ver Dashboard
						</Link>
					)}
				</div>
			</div>

			<h2 className="text-xl font-semibold">Detalle de respuestas</h2>

			{answers.map((ans) => (
				<ResultItem key={ans.id} data={ans} />
			))}
		</section>
	);

	function ResultItem({ data }: { data: AnswerResume }) {
		const [open, setOpen] = useState(false);

		return (
			<article
				className={`
        rounded-xl border shadow
        ${
					data.correct
						? "border-green-300 bg-green-50/40"
						: "border-red-300 bg-red-50/40"
				}
      `}
			>
				{/* Cabecera */}
				<header
					className="flex items-center justify-between gap-4 p-4 cursor-pointer"
					onClick={() => setOpen(!open)}
				>
					<div>
						<h3 className="font-semibold">{data.question}</h3>
						<p className="text-sm">
							Tu respuesta:{" "}
							<span
								className={
									data.correct
										? "font-medium text-green-700"
										: "font-medium text-red-700"
								}
							>
								{data.userAnswer}
							</span>
						</p>
						{!data.correct && (
							<p className="text-sm mt-0.5">
								Respuesta correcta:{" "}
								<span className="font-medium text-green-700">
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
				</header>

				{/* “Persiana” animada */}
				<AnimatePresence initial={false}>
					{open && (
						<motion.div
							key="content"
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.25, ease: "easeInOut" }}
							className="overflow-hidden border-t px-4 pb-4"
						>
							<p className="mt-3">{data.shortExplanation}</p>
							<a
								href={data.sourceUrl || "#"} // Asegurar que siempre haya un valor válido
								target={data.sourceUrl ? "_blank" : "_self"} // Abrir en nueva pestaña solo si hay URL válida
								rel="noopener noreferrer"
								className="mt-2 inline-block text-indigo-600 underline text-sm"
							>
								Ver explicación ampliada en{" "}
								{data.sourceName || "fuente desconocida"} // Mostrar texto por
								defecto si no hay fuente
							</a>
						</motion.div>
					)}
				</AnimatePresence>
			</article>
		);
	}
}
