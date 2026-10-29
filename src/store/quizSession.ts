import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { QuizQuestion } from "@/hooks/useQuestions";
import type { ConceptRef } from "@/features/learning/concepts";
import type { Confidence } from "@/features/learning/fsrs";

export type QuizAnswer = {
	question: string;
	options: string[];
	correctAnswer: string;
	selectedAnswer: string;
	subcategory?: string;
	shortExplanation?: string;
	sourceUrl?: string;
	sourceName?: string;
	/** Fase 4 */
	questionId?: string;
	confidence?: Confidence;
	concepts?: ConceptRef[];
	/** Cuándo vuelve el concepto al repaso ("mañana", "en 3 días") */
	returns?: string;
};

type QuizSessionState = {
	/** Identifica el quiz: categoría|subcategoría|nº preguntas|nivel */
	key: string | null;
	category: string | null;
	subcategory: string | null;
	questions: QuizQuestion[];
	index: number;
	answers: QuizAnswer[];
	streak: number;
	bestStreak: number;
	updatedAt: number;
	start: (
		key: string,
		meta: { category: string; subcategory?: string },
		questions: QuizQuestion[],
	) => void;
	answer: (entry: QuizAnswer) => void;
	next: () => void;
	reset: () => void;
};

const empty = {
	key: null,
	category: null,
	subcategory: null,
	questions: [],
	index: 0,
	answers: [],
	streak: 0,
	bestStreak: 0,
	updatedAt: 0,
};

/**
 * Quiz en curso, guardado en localStorage: recargar la página o salir y volver
 * retoma la misma pregunta con las mismas respuestas.
 */
export const useQuizSession = create<QuizSessionState>()(
	persist(
		(set, get) => ({
			...empty,
			start: (key, meta, questions) =>
				set({
					...empty,
					key,
					category: meta.category,
					subcategory: meta.subcategory ?? null,
					questions,
					updatedAt: Date.now(),
				}),
			answer: (entry) => {
				const { answers, index, streak, bestStreak } = get();
				if (answers.length > index) return; // ya respondida (doble pulsación)
				const correct = entry.selectedAnswer === entry.correctAnswer;
				const nextStreak = correct ? streak + 1 : 0;
				set({
					answers: [...answers, entry],
					streak: nextStreak,
					bestStreak: Math.max(bestStreak, nextStreak),
					updatedAt: Date.now(),
				});
			},
			next: () => set((s) => ({ index: s.index + 1, updatedAt: Date.now() })),
			reset: () => set(empty),
		}),
		{
			name: "webwiz-quiz-session",
			version: 1,
			storage: createJSONStorage(() => localStorage),
			partialize: ({ start, answer, next, reset, ...data }) => {
				void start;
				void answer;
				void next;
				void reset;
				return data;
			},
		},
	),
);

export function quizKey(
	category: string,
	subcategory: string | undefined,
	count: number,
	level: string,
) {
	return [category.toLowerCase(), (subcategory ?? "").toLowerCase(), count, level].join("|");
}
