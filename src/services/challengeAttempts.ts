import { supabase } from "./supabase";
import type { ChallengeFiles, TestResult } from "@/features/challenges/engine/types";

export type AttemptInput = {
	userId: string;
	challengeId: string;
	code: Partial<ChallengeFiles>;
	results: TestResult[];
	hintsUsed: number;
	durationMs: number;
};

/**
 * Guarda un intento en `challenge_attempts` (migración de la Fase 1).
 * Nunca rompe la experiencia: si falla, solo se avisa en consola.
 */
export async function saveAttempt(input: AttemptInput) {
	const { error } = await supabase.from("challenge_attempts").insert({
		user_id: input.userId,
		challenge_id: input.challengeId,
		code: input.code,
		results: input.results,
		passed: input.results.length > 0 && input.results.every((r) => r.passed),
		hints_used: input.hintsUsed,
		duration_ms: Math.round(input.durationMs),
	});
	if (error) console.warn("No se pudo guardar el intento:", error.message);
}
