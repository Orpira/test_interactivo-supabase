import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { useQuestions } from "@/hooks/useQuestions";
import QuestionCard from "@/components/ui/QuestionCard";
import { getCategoryVariants } from "@/utils/categoryVariants";

type Question = {
	question: string;
	options: string[];
	correctAnswer: string;
	shortExplanation?: string;
	sourceUrl?: string;
	sourceName?: string;
};

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

export default function QuizRunner() {
	const { category, subcategory } = useParams();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const count = Number(searchParams.get("count")) || 5;

	// Ensure category is a string
	if (!category) {
		return <p className="p-6 text-center">Categoría no especificada.</p>;
	}

	// Use useQuestions only for loading/initial state, but manage questions locally for Supabase logic
	const {
		questions: initialQuestions,
		loading: initialLoading,
		error: initialError,
	} = useQuestions(category, count, subcategory);

	const [questions, setQuestions] = useState<Question[]>(
		initialQuestions || [],
	);
	const [loading, setLoading] = useState(initialLoading);

	const [currentIndex, setCurrentIndex] = useState(0);
	const [selected, setSelected] = useState<string | null>(null);
	const [score, setScore] = useState(0);
	//const [loading, setLoading] = useState(true);
	const [showFeedback, setShowFeedback] = useState(false);
	const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
	const [summaryData, setSummaryData] = useState<AnswerSummary[]>([]);
	const [queryError, setQueryError] = useState<string | null>(initialError);

	// Utilidad para mezclar un array aleatoriamente
	function shuffleArray<T>(array: T[]): T[] {
		return array
			.map((value) => ({ value, sort: Math.random() }))
			.sort((a, b) => a.sort - b.sort)
			.map(({ value }) => value);
	}

	useEffect(() => {
		let isMounted = true;
		setQueryError(null);
		// Cargar preguntas desde Supabase filtrando por categoría y subcategoría si existe
		const loadQuestions = async () => {
			try {
				const categoryVariants = getCategoryVariants(category);
				let query = supabase
					.from("questions")
					.select("*")
					.in("category", categoryVariants);
				if (subcategory) {
					query = query.eq("subcategory", decodeURIComponent(subcategory));
				}
				const { data, error } = await query;
				if (error) throw error;
				// Barajar y tomar las primeras N
				const shuffled = shuffleArray(data ?? []).slice(0, count);
				if (isMounted) setQuestions(shuffled);
			} catch (error: any) {
				console.error("Error cargando preguntas:", error);
				if (isMounted) {
					setQueryError(
						error?.message || "No se pudieron cargar las preguntas del quiz.",
					);
				}
			} finally {
				if (isMounted) setLoading(false);
			}
		};
		loadQuestions();
		return () => {
			isMounted = false;
		};
	}, [category, subcategory, count]);

	useEffect(() => {
		if (initialError) setQueryError(initialError);
	}, [initialError]);

	const currentQuestion = questions[currentIndex];

	const handleSelect = (option: string) => {
		setSelected(option);
		// Comparar por texto real, no por valor crudo
		let selectedText = option;
		let correctText = currentQuestion.correctAnswer;
		if (typeof option === "number" && Array.isArray(currentQuestion.options)) {
			selectedText = currentQuestion.options[option] ?? option;
		}
		if (
			typeof currentQuestion.correctAnswer === "number" &&
			Array.isArray(currentQuestion.options)
		) {
			correctText =
				currentQuestion.options[currentQuestion.correctAnswer] ??
				currentQuestion.correctAnswer;
		}
		const isReallyCorrect = String(selectedText) === String(correctText);
		if (isReallyCorrect) {
			setScore((prev) => prev + 1);
		}
		const summaryEntry = {
			question: currentQuestion.question,
			options: currentQuestion.options,
			correctAnswer: currentQuestion.correctAnswer,
			selectedAnswer: option,
			subcategory: subcategory ? decodeURIComponent(subcategory) : undefined,
			shortExplanation: currentQuestion.shortExplanation,
			sourceUrl: currentQuestion.sourceUrl,
			sourceName: currentQuestion.sourceName,
		};
		setSummaryData((prev) => [...prev, summaryEntry]);
		// Avanzar automáticamente
		setTimeout(() => {
			if (currentIndex + 1 < questions.length) {
				setCurrentIndex((prev) => prev + 1);
				setSelected(null);
			} else {
				const summaryCopy = [...summaryData, summaryEntry];
				// Mostrar resultado automáticamente al terminar
				navigate("/result", {
					state: {
						score: isReallyCorrect ? score + 1 : score,
						total: questions.length,
						category,
						summary: summaryCopy,
						subcategory: subcategory
							? decodeURIComponent(subcategory)
							: undefined,
					},
				});
				// No limpiar el estado aquí, para que el usuario pueda ver el resultado y navegar correctamente
			}
		}, 300); // Pequeño delay para UX
	};

	if (loading) return <p className="p-6 text-center">Cargando preguntas...</p>;
	if (queryError) {
		return <p className="p-6 text-center text-red-600">{queryError}</p>;
	}
	if (!currentQuestion)
		return <p className="p-6 text-center">No se encontraron preguntas.</p>;

	return (
		<div className="w-full max-w-4xl mx-auto p-6 ">
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
				onPrev={undefined}
			/>
		</div>
	);
}
