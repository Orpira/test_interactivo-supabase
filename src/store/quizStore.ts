import { create } from "zustand";

type Question = {
  question: string;
  options: string[];
  correctAnswer: string;
};

type Answer = {
  question: string;
  selected: string;
  correct: string;
  isCorrect: boolean;
};

interface QuizState {
  questions: Question[];
  currentIndex: number;
  selected: string | null;
  score: number;
  showFeedback: boolean;
  result: { score: number; total: number; category: string } | null;
  answers: Answer[];
  setQuestions: (questions: Question[]) => void;
  setSelected: (option: string) => void;
  nextQuestion: (correct: boolean) => void;
  resetQuiz: () => void;
  setShowFeedback: (show: boolean) => void;
  setFinalResult: (score: number, total: number, category: string) => void;
  setAnswers: (answers: Answer[]) => void;
  fetchQuestionsFromAPI: (category: string, count: number) => Promise<void>;
}

export const useQuizStore = create<QuizState>((set) => ({
  questions: [],
  currentIndex: 0,
  selected: null,
  score: 0,
  showFeedback: false,
  result: null,
  answers: [],
  setQuestions: (questions) => set({ questions, currentIndex: 0, score: 0 }),
  setSelected: (option) => set({ selected: option }),
  nextQuestion: (correct) =>
    set((state) => {
      const nextScore = correct ? state.score + 1 : state.score;
      const nextIndex = state.currentIndex + 1;
      return {
        currentIndex: nextIndex,
        score: nextScore,
        selected: null,
        showFeedback: false,
      };
    }),
  resetQuiz: () =>
    set({
      questions: [],
      currentIndex: 0,
      selected: null,
      score: 0,
      showFeedback: false,
      result: null,
      answers: [],
    }),
  setShowFeedback: (show) => set({ showFeedback: show }),
  setFinalResult: (score, total, category) =>
    set({ result: { score, total, category } }),
  setAnswers: (answers) => set({ answers }),
  fetchQuestionsFromAPI: async (category, count) => {
    try {
      const axios = (await import("axios")).default;
      const response = await axios.get("https://quizapi.io/api/v1/questions", {
        params: {
          category,
          limit: count,
          difficulty: "Easy", // Puedes parametrizar esto si lo deseas
        },
        headers: {
          "X-Api-Key": import.meta.env.VITE_QUIZAPI_KEY,
        },
      });
      const questions = response.data.map((q: any) => {
        // Las opciones de quizapi.io son un objeto tipo { answer_a: string, answer_b: string, ... }
        // correctAnswer es la clave (ej: 'answer_b')
        const options = Object.entries(q.answers)
          .filter(([_, v]) => v)
          .map(([key, value]) => value); // Solo el texto de la respuesta
        const correctKey = Object.entries(q.correct_answers)
          .find(([_, v]) => v === "true")?.[0]
          ?.replace("_correct", "");
        // El valor correcto es el texto de la respuesta
        const correctAnswer = q.answers[correctKey ? correctKey : ""] || "";
        return {
          question: q.question,
          options,
          correctAnswer,
        };
      });
      set({ questions, currentIndex: 0, score: 0 });
    } catch (error) {
      if (typeof error === "object" && error !== null && "message" in error) {
        console.error(
          "Error al obtener preguntas:",
          // @ts-ignore
          error.message
        );
      } else {
        console.error("Error desconocido:", error);
      }
      set({ questions: [] });
    }
  },
}));

// Utilidad para mezclar opciones
function shuffleArray(array: string[]) {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}
