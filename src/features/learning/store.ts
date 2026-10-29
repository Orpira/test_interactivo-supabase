import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Grade } from "ts-fsrs";
import type { ConceptRef } from "./concepts";
import { isDue, ratingFor, retrievability, returnsLabel, reviewConcept, type Confidence, type StoredCard } from "./fsrs";
import { EMPTY_STREAK, recordActivity, settleStreak, type Streak } from "./streak";

export type AnswerRecord = {
	questionId: string;
	chosen: string;
	correct: boolean;
	confidence: Confidence;
	concepts: ConceptRef[];
};

type LearningState = {
	/** Usuario dueño de estos datos (null = invitado) */
	owner: string | null;
	cards: Record<string, StoredCard>;
	streak: Streak;
	updatedAt: number;
	/** Un quiz con ≥5 respuestas «Seguro», todas acertadas */
	perfectCalibration: boolean;
	markPerfectCalibration: () => void;
	setOwner: (owner: string | null) => void;
	recordAnswer: (a: AnswerRecord, now?: Date) => { cards: StoredCard[]; returns: string; rating: Grade };
	touchStreak: (now?: Date) => Streak;
	merge: (cards: StoredCard[], streak: Streak | null) => void;
};

/**
 * Progreso de aprendizaje (tarjetas FSRS por concepto y racha). Se guarda en
 * el dispositivo y, con sesión, se sincroniza con Supabase (learningSync).
 */
export const useLearning = create<LearningState>()(
	persist(
		(set, get) => ({
			owner: null,
			cards: {},
			streak: EMPTY_STREAK,
			updatedAt: 0,
			perfectCalibration: false,
			markPerfectCalibration: () => set({ perfectCalibration: true }),
			setOwner: (owner) => {
				if (get().owner === owner) return;
				// Datos de invitado: se conservan al iniciar sesión. Otro usuario: se empieza de cero.
				if (get().owner && owner && get().owner !== owner) set({ cards: {}, streak: EMPTY_STREAK });
				set({ owner });
			},
			recordAnswer: (a, now = new Date()) => {
				const rating = ratingFor(a.correct, a.confidence);
				const cards = { ...get().cards };
				const updated = a.concepts.map((c) => {
					const card = reviewConcept(cards[c.id], c, rating, now);
					cards[c.id] = card;
					return card;
				});
				set({ cards, streak: recordActivity(get().streak, now), updatedAt: now.getTime() });
				const soonest = updated.map((c) => c.due).sort()[0];
				return { cards: updated, returns: soonest ? returnsLabel(soonest, now) : "", rating };
			},
			touchStreak: (now = new Date()) => {
				const streak = settleStreak(get().streak, now);
				set({ streak });
				return streak;
			},
			merge: (incoming, streak) => {
				const cards = { ...get().cards };
				for (const c of incoming) {
					const mine = cards[c.conceptId];
					if (!mine || mine.updatedAt < c.updatedAt) cards[c.conceptId] = c;
				}
				const mineStreak = get().streak;
				const best =
					streak && (streak.lastActive ?? "") > (mineStreak.lastActive ?? "") ? { ...streak, best: Math.max(streak.best, mineStreak.best) } : mineStreak;
				set({ cards, streak: best });
			},
		}),
		{
			name: "webwiz-learning",
			version: 1,
			storage: createJSONStorage(() => localStorage),
			partialize: ({ owner, cards, streak, updatedAt, perfectCalibration }) => ({ owner, cards, streak, updatedAt, perfectCalibration }),
		},
	),
);

/** Conceptos del repaso de hoy, los más olvidados primero. */
export function dueConcepts(cards: Record<string, StoredCard>, now: Date = new Date()): StoredCard[] {
	return Object.values(cards)
		.filter((c) => isDue(c, now))
		.sort((a, b) => retrievability(a, now) - retrievability(b, now));
}
