export type TestResult = {
  userId: string;
  date: string;
  score: number; // Ejemplo: 8
  total: number; // Ejemplo: 10
  category: string; // Ejemplo: "HTML"
};
export type TestHistory = {
  results: TestResult[];
  totalTests: number;
  lastTestAt: string; // fecha ISO
  categories: {
    [key: string]: {
      tests: number;
      correctAnswers: number;
      totalQuestions: number;
    };
  };
};
export type CodeSubmission = {
  userId: string;
  code: string; // Código enviado
  createdAt: string; // fecha ISO
  updatedAt: string; // fecha ISO
};
export type AnswerResume = {
  id: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  correct: boolean;
  shortExplanation: string;
  sourceUrl: string;
  sourceName: string;
};
