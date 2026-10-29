import { describe, it, expect } from "vitest";
import { Rating } from "ts-fsrs";
import { areaFor, conceptsForQuestion, slugify } from "../../src/features/learning/concepts";
import { isDue, ratingFor, returnsLabel, reviewConcept, verdictFor } from "../../src/features/learning/fsrs";
import { EMPTY_STREAK, recordActivity, settleStreak, weekDots, dayKey } from "../../src/features/learning/streak";
import { calibration, diagnosisHeadline, overconfidentCount, splitConcepts, type GradedAnswer } from "../../src/features/learning/diagnosis";
import { leagueSummary } from "../../src/features/learning/league";
import { dueConcepts } from "../../src/features/learning/store";

const day = (d: number, h = 10) => new Date(2026, 9, d, h); // octubre 2026 (29 = jueves)
const closures = { id: "closures", name: "Closures", area: "JavaScript" };

describe("conceptos", () => {
	it("slugify quita tildes y símbolos", () => {
		expect(slugify("Árboles DOM & Eventos")).toBe("arboles-dom-eventos");
		expect(slugify("  CI/CD  ")).toBe("ci-cd");
	});
	it("área por subcategoría y, si no, por categoría", () => {
		expect(areaFor("Flexbox", "frontend")).toBe("CSS");
		expect(areaFor("Formularios", "frontend")).toBe("HTML");
		expect(areaFor("Docker", "devops")).toBe("DevOps");
		expect(areaFor(null, "backend")).toBe("Backend");
		expect(areaFor("Closures", "frontend")).toBe("JavaScript");
	});
	it("conceptos explícitos o derivados", () => {
		expect(conceptsForQuestion({ concepts: ["closures"] })).toEqual([closures]);
		expect(conceptsForQuestion({ category: "frontend", subcategory: "Flexbox" })).toEqual([{ id: "flexbox", name: "Flexbox", area: "CSS" }]);
		expect(conceptsForQuestion({ category: "css" })[0]).toMatchObject({ id: "css", area: "CSS" });
	});
});

describe("FSRS por concepto", () => {
	it("confianza → calificación", () => {
		expect(ratingFor(false, "seguro")).toBe(Rating.Again);
		expect(ratingFor(true, "adivino")).toBe(Rating.Hard);
		expect(ratingFor(true, "creo")).toBe(Rating.Good);
		expect(ratingFor(true, "seguro")).toBe(Rating.Easy);
	});
	it("veredictos", () => {
		expect(verdictFor(false, "seguro").text).toBe("Fallo con confianza alta");
		expect(verdictFor(true, "adivino").text).toBe("Acierto, pero adivinando");
	});
	it("un concepto fallado con «Seguro» aparece en el repaso del día siguiente", () => {
		const card = reviewConcept(undefined, closures, ratingFor(false, "seguro"), day(29));
		expect(card.state).toBe("reforzar");
		expect(isDue(card, day(29, 20))).toBe(false);
		expect(isDue(card, day(30, 9))).toBe(true);
		expect(returnsLabel(card.due, day(29))).toBe("mañana");
		expect(dueConcepts({ closures: card }, day(30)).map((c) => c.conceptId)).toEqual(["closures"]);
	});
	it("varias respuestas del mismo día cuentan como un repaso con la peor nota", () => {
		const a = reviewConcept(undefined, closures, Rating.Easy, day(29, 10));
		const b = reviewConcept(a, closures, Rating.Again, day(29, 11));
		const c = reviewConcept(b, closures, Rating.Easy, day(29, 12));
		expect(b.lastRating).toBe(Rating.Again);
		expect(c.lastRating).toBe(Rating.Again);
		expect(c.fsrs.reps).toBe(1);
	});
	it("aciertos seguros repetidos en días distintos llevan a «Dominado»", () => {
		let card = reviewConcept(undefined, closures, Rating.Easy, day(1));
		expect(card.state).toBe("progreso"); // un solo acierto no basta
		card = reviewConcept(card, closures, Rating.Easy, new Date(card.due));
		expect(card.state).toBe("dominado");
		card = reviewConcept(undefined, closures, Rating.Good, day(1));
		expect(card.state).toBe("progreso");
		card = reviewConcept(card, closures, Rating.Good, new Date(card.due));
		card = reviewConcept(card, closures, Rating.Good, new Date(card.due));
		expect(card.state).toBe("dominado");
	});
});

describe("racha con protector", () => {
	it("días seguidos suman", () => {
		let s = recordActivity(EMPTY_STREAK, day(26));
		s = recordActivity(s, day(27));
		s = recordActivity(s, day(27, 22));
		expect(s.current).toBe(2);
	});
	it("sobrevive a un día sin actividad si hay protector", () => {
		let s = recordActivity(EMPTY_STREAK, day(26)); // lunes
		s = recordActivity(s, day(27));
		s = recordActivity(s, day(29)); // el 28 no hubo actividad
		expect(s.current).toBe(3);
		expect(s.freezes).toBe(0);
		expect(s.frozen).toEqual([dayKey(day(28))]);
		expect(weekDots(s, day(29)).map((d) => d.state)).toEqual(["hecho", "hecho", "protegido", "hecho", "futuro", "futuro", "futuro"]);
	});
	it("sin protector se rompe; el lunes siguiente se recarga", () => {
		let s = recordActivity(EMPTY_STREAK, day(26));
		s = recordActivity(s, day(28)); // gasta el protector
		s = recordActivity(s, day(31)); // faltan 29 y 30, sin protector
		expect(s.current).toBe(1);
		expect(s.best).toBe(2); // el día protegido conserva la racha pero no suma
		s = recordActivity(s, new Date(2026, 10, 1));
		expect(s.freezes).toBe(0);
		expect(settleStreak(s, new Date(2026, 10, 2)).freezes).toBe(1); // lunes 2 de noviembre: recarga
	});
});

describe("diagnóstico y calibración", () => {
	const c = (id: string) => [{ id, name: id }];
	const answers: GradedAnswer[] = [
		{ correct: true, confidence: "seguro", concepts: c("Closures") },
		{ correct: true, confidence: "seguro", concepts: c("Closures") },
		{ correct: false, confidence: "seguro", concepts: c("Event loop") },
		{ correct: true, confidence: "adivino", concepts: c("Hoisting") },
		{ correct: false, confidence: "creo", concepts: c("Event loop") },
	];
	it("calibración por confianza", () => {
		expect(calibration(answers)).toEqual([
			{ confidence: "seguro", correct: 2, total: 3, pct: 67 },
			{ confidence: "creo", correct: 0, total: 1, pct: 0 },
			{ confidence: "adivino", correct: 1, total: 1, pct: 100 },
		]);
		expect(overconfidentCount(answers)).toBe(1);
	});
	it("dominados / a reforzar y titular", () => {
		const split = splitConcepts(answers);
		expect(split.strong.map((x) => x.id)).toEqual(["Closures"]);
		expect(split.weak.map((x) => x.id)).toEqual(["Event loop", "Hoisting"]);
		expect(diagnosisHeadline(split, 1)).toBe("Dominas Closures. Event loop todavía te engaña.");
	});
});

describe("liga semanal", () => {
	const rows = Array.from({ length: 20 }, (_, i) => ({ user_id: `u${i}`, name: `U${i}`, points: 100 - i, position: i + 1, is_me: i === 3 }));
	it("zona de ascenso y días restantes", () => {
		expect(leagueSummary(rows, "semi_senior", day(29))).toEqual({ division: "Plata", position: 4, size: 20, zone: "sube", daysLeft: 4 });
	});
	it("zona de descenso", () => {
		const r = rows.map((x) => ({ ...x, is_me: x.position === 18 }));
		expect(leagueSummary(r, "junior", day(29))?.zone).toBe("baja");
	});
});
