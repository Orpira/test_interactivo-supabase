import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuestions } from "@/hooks/useQuestions";
import QuestionCard from "@/components/ui/QuestionCard";
import { getStoredExperienceLevel } from "@/services/feedback";

type AnswerSummary = {
	question: string;
	options: string[];
	correctAnswer: string;
	selectedAnswer: string;
	subcategory?: string;
	shortExplanation?: string;
	sourceUrl?: string;
	sourceName?: string;
};

const ADVANCE_DELAY_MS = 300;

export default function QuizRunner() {
	const { category, subcategory } = useParams();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const requested = Number(searchParams.get("count"));
	const count =
		Number.isFinite(requested) && requested > 0 ? Math.min(requested, 50) : 5;
	const difficulty = getStoredExperienceLevel() ?? "junior";
	const decodedSubcategory = subcategory ? safeDecode(subcategory) : undefined;

	const [reloadKey, setReloadKey] = useState(0);
	const { questions, loading, error } = useQuestions(
		category,
		count,
		subcategory,
		difficulty,
		reloadKey
	);

	const [currentIndex, setCurrentIndex] = useState(0);
	const [selected, setSelected] = useState<string | null>(null);
	const answersRef = useRef<AnswerSummary[]>([]);
	const lockedRef = useRef(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Reiniciar el progreso cada vez que llega un nuevo set de preguntas
	// (cambio de categoría/subcategoría o "reiniciar").
	useEffect(() => {
		setCurrentIndex(0);
		setSelected(null);
		answersRef.current = [];
		lockedRef.current = false;
	}, [questions]);

	useEffect(
		() => () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		},
		[]
	);

	if (!category) {
		return <p className="p-6 text-center">Categoría no especificada.</p>;
	}

	const currentQuestion = questions[currentIndex];

	const handleSelect = (option: string) => {
		// Evita doble puntuación por doble clic durante la transición.
		if (lockedRef.current || !currentQuestion) return;
		lockedRef.current = true;
		setSelected(option);

		answersRef.current = [
			...answersRef.current,
			{
				question: currentQuestion.question,
				options: currentQuestion.options,
				correctAnswer: currentQuestion.correctAnswer,
				selectedAnswer: option,
				subcategory: decodedSubcategory,
				shortExplanation: currentQuestion.shortExplanation,
				sourceUrl: currentQuestion.sourceUrl,
				sourceName: currentQuestion.sourceName,
			},
		];

		timerRef.current = setTimeout(() => {
			if (currentIndex + 1 < questions.length) {
				setCurrentIndex(currentIndex + 1);
				setSelected(null);
				lockedRef.current = false;
				return;
			}

			const summary = answersRef.current;
			const score = summary.filter(
				(a) => a.selectedAnswer === a.correctAnswer
			).length;

			navigate("/result", {
				state: {
					score,
					total: questions.length,
					category,
					subcategory: decodedSubcategory,
					summary,
				},
			});
		}, ADVANCE_DELAY_MS);
	};

	if (loading) return <p className="p-6 text-center">Cargando preguntas...</p>;
	if (error) {
		return (
			<div className="p-6 text-center space-y-3">
				<p className="text-red-600">{error}</p>
				<button
					className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
					onClick={() => setReloadKey((k) => k + 1)}
				>
					Reintentar
				</button>
			</div>
		);
	}
	if (!currentQuestion)
		return <p className="p-6 text-center">No se encontraron preguntas.</p>;

	return (
		<div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
			<QuestionCard
				category={category}
				question={currentQuestion.question}
				options={currentQuestion.options}
				selected={selected}
				onSelect={handleSelect}
				correctAnswer={currentQuestion.correctAnswer}
				showFeedback={false}
				number={currentIndex + 1}
				total={questions.length}
				onRestart={() => setReloadKey((k) => k + 1)}
			/>
		</div>
	);
}

function safeDecode(value: string) {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}
