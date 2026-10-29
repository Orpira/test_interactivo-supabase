import { supabase } from "./supabase";
import type { ExplainReview } from "../../supabase/functions/explain-review/review";

export type { ExplainReview };

/**
 * Pide a la Edge Function `explain-review` que Claude corrija la respuesta.
 * Nunca lanza: devuelve la corrección o un mensaje de error amable.
 */
export async function requestExplainReview(
	questionId: string,
	answer: string,
): Promise<{ review: ExplainReview; cached: boolean } | { error: string }> {
	try {
		const { data, error } = await supabase.functions.invoke("explain-review", { body: { questionId, answer } });
		if (error) {
			const ctx = (error as { context?: Response }).context;
			const body = ctx && typeof ctx.json === "function" ? await ctx.json().catch(() => null) : null;
			return { error: (body as { error?: string } | null)?.error ?? "No se pudo conectar con el corrector. Inténtalo más tarde." };
		}
		const review = (data as { review?: ExplainReview })?.review;
		if (!review || typeof review.score !== "number" || !Array.isArray(review.covered)) {
			return { error: "La corrección llegó incompleta. Inténtalo de nuevo." };
		}
		return { review, cached: !!(data as { cached?: boolean }).cached };
	} catch {
		return { error: "No se pudo conectar con el corrector. Inténtalo más tarde." };
	}
}
