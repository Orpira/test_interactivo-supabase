import { describe, it, expect } from "vitest";
import { calculateAchievements } from "../../src/utils/achievements";

const r = (date: string, score: number, total = 10, category = "html") => ({
	userId: "u1",
	date,
	score,
	total,
	category,
});

const unlocked = (results: ReturnType<typeof r>[]) =>
	Object.fromEntries(
		calculateAchievements(results).map((a) => [a.title, a.unlocked])
	);

describe("calculateAchievements", () => {
	it("detecta mejora aunque el historial llegue del más reciente al más antiguo", () => {
		const newestFirst = [
			r("2026-10-04", 9),
			r("2026-10-03", 8),
			r("2026-10-02", 4),
			r("2026-10-01", 3),
		];
		expect(unlocked(newestFirst)["Mejora continua"]).toBe(true);
	});

	it("no marca mejora si el rendimiento empeora", () => {
		const newestFirst = [r("2026-10-02", 3), r("2026-10-01", 9)];
		expect(unlocked(newestFirst)["Mejora continua"]).toBe(false);
	});

	it("cuenta categorías sin distinguir mayúsculas e ignora totales a cero", () => {
		const res = unlocked([
			r("2026-10-01", 5, 10, "HTML"),
			r("2026-10-02", 5, 10, "html"),
			r("2026-10-03", 5, 10, "css"),
			r("2026-10-04", 0, 0, "js"),
		]);
		expect(res["Explorador de categorías"]).toBe(false);
		expect(res["Primer quiz completado"]).toBe(true);
	});

	it("desbloquea la puntuación perfecta", () => {
		expect(unlocked([r("2026-10-01", 10)])["Puntuación perfecta"]).toBe(true);
	});

	it("logros de habilidades (Fase 4)", () => {
		const titles = (skills: Parameters<typeof calculateAchievements>[1]) =>
			calculateAchievements([], skills).filter((a) => a.unlocked).map((a) => a.title);
		expect(titles({ dominated: 0, incidentsClosed: 9, perfectCalibration: false })).toEqual([]);
		expect(titles({ dominated: 1, incidentsClosed: 10, perfectCalibration: true })).toEqual([
			"Primer concepto dominado",
			"10 incidencias cerradas",
			"Calibración perfecta",
		]);
	});
});
