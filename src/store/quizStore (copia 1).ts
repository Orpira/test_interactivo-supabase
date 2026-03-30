import { create } from "zustand";
import axios from "axios";

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
      const response = await axios.get(
        `https://opentdb.com/api.php?amount=${count}&category=${category}&type=multiple`
      );
      const questions = response.data.results.map((q: any) => ({
        question: q.question,
        options: shuffleArray([q.correct_answer, ...q.incorrect_answers]),
        correctAnswer: q.correct_answer,
      }));
      set({ questions, currentIndex: 0, score: 0 });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Error al obtener preguntas con Axios:",
          error.response?.data || error.message
        );
      } else {
        console.error("Error desconocido:", error);
      }
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
