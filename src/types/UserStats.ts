// types/UserStats.ts
export type UserStats = {
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
export type UserHistoryItem = {
  id: string;
  category: string;
  createdAt: string; // fecha ISO
  score: number;
  total: number;
};
export type UserHistory = {
  items: UserHistoryItem[];
};
