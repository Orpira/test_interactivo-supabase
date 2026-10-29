import { supabase } from "./supabase";
import type { AnswerRecord } from "@/features/learning/store";
import type { StoredCard } from "@/features/learning/fsrs";
import type { Streak } from "@/features/learning/streak";

/**
 * Sincronización del aprendizaje con Supabase (migración de la Fase 4).
 * Nunca rompe la experiencia: los errores solo se avisan en consola y el
 * progreso sigue guardado en el dispositivo.
 */
const warn = (what: string, error: { message?: string } | null) => {
	if (error) console.warn(`No se pudo guardar ${what}:`, error.message);
};

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export async function pushAnswer(userId: string, a: AnswerRecord, cards: StoredCard[], streak: Streak) {
	const tasks: PromiseLike<unknown>[] = [];
	if (isUuid(a.questionId)) {
		tasks.push(
			supabase
				.from("answers")
				.insert({ user_id: userId, question_id: a.questionId, chosen: a.chosen, correct: a.correct, confidence: a.confidence })
				.then(({ error }) => warn("la respuesta", error)),
		);
	}
	// Una fila por concepto: si un concepto no existe en el catálogo, no bloquea al resto
	for (const c of cards) tasks.push(pushCard(userId, c));
	tasks.push(pushStreak(userId, streak));
	await Promise.all(tasks);
}

export function pushCard(userId: string, c: StoredCard) {
	return supabase
		.from("concept_cards")
		.upsert({ user_id: userId, concept_id: c.conceptId, fsrs: c, due: c.due, state: c.state }, { onConflict: "user_id,concept_id" })
		.then(({ error }) => warn(`el concepto ${c.conceptId}`, error));
}

export function pushStreak(userId: string, s: Streak) {
	return supabase
		.from("streaks")
		.upsert(
			{ user_id: userId, current: s.current, best: s.best, freezes: s.freezes, last_active: s.lastActive, detail: s },
			{ onConflict: "user_id" },
		)
		.then(({ error }) => warn("la racha", error));
}

export async function pullLearning(userId: string): Promise<{ cards: StoredCard[]; streak: Streak | null }> {
	const [cards, streak] = await Promise.all([
		supabase.from("concept_cards").select("fsrs").eq("user_id", userId),
		supabase.from("streaks").select("detail").eq("user_id", userId).maybeSingle(),
	]);
	return {
		cards: ((cards.data ?? []) as { fsrs: StoredCard }[]).map((r) => r.fsrs).filter((c) => c && c.conceptId),
		streak: (streak.data as { detail: Streak } | null)?.detail ?? null,
	};
}
