import type { TestResult } from "../types/TestResult";

export type Achievement = {
	icon: string;
	title: string;
	unlocked: boolean;
};

const average = (values: number[]) =>
	values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

/** Datos de la Fase 4 (habilidades) para los logros nuevos. */
export type SkillStats = { dominated: number; incidentsClosed: number; perfectCalibration: boolean };

export function calculateAchievements(
	results: TestResult[],
	skills: SkillStats = { dominated: 0, incidentsClosed: 0, perfectCalibration: false },
): Achievement[] {
	const valid = results.filter((r) => r.total > 0);

	// Orden cronológico (más antiguo primero), independientemente de cómo
	// lleguen los datos: necesario para medir la mejora.
	const chronological = [...valid].sort(
		(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
	);
	const scores = chronological.map((r) => r.score / r.total);
	const categories = new Set(valid.map((r) => r.category.toLowerCase()));

	const half = Math.floor(scores.length / 2);
	const improved =
		scores.length >= 2 &&
		average(scores.slice(scores.length - half)) >
			average(scores.slice(0, half));

	return [
		{
			icon: "🥇",
			title: "Primer quiz completado",
			unlocked: valid.length >= 1,
		},
		{ icon: "🔥", title: "5 quizzes completados", unlocked: valid.length >= 5 },
		{
			icon: "💯",
			title: "Puntuación perfecta",
			unlocked: valid.some((r) => r.score === r.total),
		},
		{
			icon: "🚀",
			title: "Explorador de categorías",
			unlocked: categories.size >= 3,
		},
		{ icon: "📈", title: "Mejora continua", unlocked: improved },
		{ icon: "🧠", title: "Primer concepto dominado", unlocked: skills.dominated >= 1 },
		{ icon: "🐞", title: "10 incidencias cerradas", unlocked: skills.incidentsClosed >= 10 },
		{ icon: "🎯", title: "Calibración perfecta", unlocked: skills.perfectCalibration },
	];
}
