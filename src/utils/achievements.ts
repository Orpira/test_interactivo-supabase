import { TestResult } from "../types/TestResult";

export function calculateAchievements(results: TestResult[]) {
  const categories = new Set<string>();
  let perfectScore = false;
  let totalTests = results.length;
  let improved = false;

  let unlocked = {
    firstTest: totalTests >= 1,
    fiveTests: totalTests >= 5,
    perfect: false,
    allCategories: false,
    improvement: false,
  };

  let scores: number[] = [];

  results.forEach((r) => {
    if (r.score === r.total) unlocked.perfect = true;
    categories.add(r.category);
    scores.push(r.score / r.total);
  });

  if (categories.size >= 3) unlocked.allCategories = true;
  if (scores.length >= 2) {
    const firstHalf = scores
      .slice(0, Math.floor(scores.length / 2))
      .reduce((a, b) => a + b, 0);
    const secondHalf = scores
      .slice(Math.floor(scores.length / 2))
      .reduce((a, b) => a + b, 0);
    if (secondHalf / (scores.length / 2) > firstHalf / (scores.length / 2)) {
      unlocked.improvement = true;
    }
  }

  return [
    {
      icon: "🥇",
      title: "Primer quiz completado",
      unlocked: unlocked.firstTest,
    },
    { icon: "🔥", title: "5 quizzes seguidos", unlocked: unlocked.fiveTests },
    { icon: "💯", title: "Puntuación perfecta", unlocked: unlocked.perfect },
    {
      icon: "🚀",
      title: "Explorador de categorías",
      unlocked: unlocked.allCategories,
    },
    { icon: "📈", title: "Mejora continua", unlocked: unlocked.improvement },
  ];
}
