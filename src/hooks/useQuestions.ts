import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { getCategoryVariants } from "@/utils/categoryVariants";
import type { ExperienceLevel } from "@/services/feedback";
import { shuffleArray } from "@/utils/shuffle";

export type QuizQuestion = {
	id: string;
	question: string;
	options: string[];
	correctAnswer: string;
	difficulty?: ExperienceLevel;
	shortExplanation?: string;
	sourceUrl?: string;
	sourceName?: string;
	/** Fase 4 (columnas opcionales: sin la migración llegan vacías) */
	category?: string;
	subcategory?: string;
	concepts?: string[];
	kind?: "choice" | "predict" | "explain";
	code?: string;
	optionMeta?: Record<string, { misconception?: string; whyTempting?: string }>;
};

const BASE_COLUMNS = "id, question, options, correctAnswer, difficulty, shortExplanation, sourceUrl, sourceName, category, subcategory";
const FULL_COLUMNS = `${BASE_COLUMNS}, concepts, kind, code, option_meta`;

type QuestionQuery = ReturnType<ReturnType<typeof supabase.from>["select"]>;
type Filter = (q: QuestionQuery) => QuestionQuery;

/**
 * SELECT con las columnas de la Fase 4; si la migración aún no se ha
 * aplicado (columna inexistente), repite la consulta con las básicas.
 */
export async function selectQuestions(filter: Filter): Promise<QuizQuestion[]> {
	// Las preguntas abiertas ("Explícalo tú") no son de test: nunca entran en un quiz
	const playable = (q: QuizQuestion) => q.kind !== "explain" && q.options.length >= 2;
	const full = await filter(supabase.from("questions").select(FULL_COLUMNS));
	if (!full.error) return (full.data ?? []).map((r) => normalizeQuestion(r as Record<string, unknown>)).filter(playable);
	if (!/column|42703/i.test(`${full.error.code} ${full.error.message}`)) throw full.error;
	const basic = await filter(supabase.from("questions").select(BASE_COLUMNS));
	if (basic.error) throw basic.error;
	return (basic.data ?? []).map((r) => normalizeQuestion(r as Record<string, unknown>)).filter(playable);
}

type QuestionsState = {
	questions: QuizQuestion[];
	loading: boolean;
	error: string | null;
};

/**
 * Carga las preguntas de un quiz en una sola consulta.
 *
 * - Prioriza las preguntas del nivel de experiencia indicado y, si no hay
 *   suficientes, completa con preguntas de otros niveles para no dejar el
 *   quiz vacío o más corto de lo pedido.
 * - Baraja preguntas y opciones en cada intento.
 * - Ignora respuestas de peticiones obsoletas (cambio rápido de categoría).
 */
export function useQuestions(
	category: string | undefined,
	count: number = 10,
	subcategory?: string,
	difficulty?: ExperienceLevel,
	reloadKey: number = 0,
	/** false: no consulta (p. ej. al retomar un quiz guardado) */
	enabled: boolean = true,
) {
	const [state, setState] = useState<QuestionsState>({
		questions: [],
		loading: true,
		error: null,
	});

	useEffect(() => {
		if (!category || !enabled) {
			setState({ questions: [], loading: false, error: null });
			return;
		}

		let cancelled = false;
		setState({ questions: [], loading: true, error: null });

		const load = async () => {
			try {
				const all = await selectQuestions((q) => {
					let query = q.in("category", getCategoryVariants(category));
					if (subcategory) query = query.eq("subcategory", safeDecode(subcategory));
					return query;
				});
				const preferred = difficulty
					? all.filter((q) => q.difficulty === difficulty)
					: all;
				const rest = difficulty
					? all.filter((q) => q.difficulty !== difficulty)
					: [];

				const selected = [...shuffleArray(preferred), ...shuffleArray(rest)]
					.slice(0, count)
					.map((q) => ({ ...q, options: shuffleArray(q.options) }));

				if (!cancelled) {
					setState({ questions: selected, loading: false, error: null });
				}
			} catch (err) {
				console.error("Error cargando preguntas:", err);
				if (!cancelled) {
					setState({
						questions: [],
						loading: false,
						error:
							(err as { message?: string })?.message ||
							"No se pudieron cargar las preguntas del quiz.",
					});
				}
			}
		};

		load();
		return () => {
			cancelled = true;
		};
	}, [category, count, subcategory, difficulty, reloadKey, enabled]);

	return state;
}

function safeDecode(value: string) {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

// Algunas filas antiguas guardan options como string JSON o correctAnswer
// como índice numérico: lo normalizamos todo a texto.
function normalizeQuestion(row: Record<string, unknown>): QuizQuestion {
	let options: unknown = row.options;
	if (typeof options === "string") {
		try {
			options = JSON.parse(options);
		} catch {
			options = [options];
		}
	}
	const optionList = Array.isArray(options) ? options.map(String) : [];

	let correctAnswer = row.correctAnswer as unknown;
	if (
		typeof correctAnswer === "number" ||
		(typeof correctAnswer === "string" &&
			/^\d+$/.test(correctAnswer) &&
			!optionList.includes(correctAnswer))
	) {
		correctAnswer = optionList[Number(correctAnswer)] ?? correctAnswer;
	}

	return {
		id: String(row.id),
		question: String(row.question ?? ""),
		options: optionList,
		correctAnswer: String(correctAnswer ?? ""),
		difficulty: row.difficulty as ExperienceLevel | undefined,
		shortExplanation: (row.shortExplanation as string) ?? undefined,
		sourceUrl: (row.sourceUrl as string) ?? undefined,
		sourceName: (row.sourceName as string) ?? undefined,
		category: (row.category as string) ?? undefined,
		subcategory: (row.subcategory as string) ?? undefined,
		concepts: Array.isArray(row.concepts) ? (row.concepts as string[]) : undefined,
		kind: (row.kind as QuizQuestion["kind"]) ?? "choice",
		code: (row.code as string) ?? undefined,
		optionMeta: (row.option_meta as QuizQuestion["optionMeta"]) ?? undefined,
	};
}
