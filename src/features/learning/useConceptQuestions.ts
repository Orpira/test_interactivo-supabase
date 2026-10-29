import { useEffect, useState } from "react";
import { selectQuestions, type QuizQuestion } from "@/hooks/useQuestions";
import { shuffleArray } from "@/utils/shuffle";
import { conceptsForQuestion } from "./concepts";

type State = { questions: QuizQuestion[]; loading: boolean; error: string | null };

/**
 * Reparte `count` preguntas entre grupos (conceptos o áreas) por turnos, para
 * que el repaso toque todos los conceptos antes de repetir uno.
 */
export function roundRobin<T>(groups: T[][], count: number): T[] {
	const queues = groups.map((g) => [...g]).filter((g) => g.length);
	const out: T[] = [];
	while (out.length < count && queues.some((q) => q.length)) {
		for (const q of queues) {
			const item = q.shift();
			if (item !== undefined && out.length < count) out.push(item);
		}
	}
	return out;
}

function useAsyncQuestions(load: (() => Promise<QuizQuestion[]>) | null, deps: unknown[]): State {
	const [state, setState] = useState<State>({ questions: [], loading: !!load, error: null });
	useEffect(() => {
		if (!load) {
			setState({ questions: [], loading: false, error: null });
			return;
		}
		let cancelled = false;
		setState({ questions: [], loading: true, error: null });
		load()
			.then((questions) => !cancelled && setState({ questions, loading: false, error: null }))
			.catch((e: { message?: string }) => {
				console.error("Error cargando preguntas:", e);
				if (!cancelled) setState({ questions: [], loading: false, error: e?.message || "No se pudieron cargar las preguntas." });
			});
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- deps explícitas
	}, deps);
	return state;
}

/** Repaso: preguntas de los conceptos indicados, repartidas entre ellos. */
export function useConceptQuestions(conceptIds: string[], count: number, enabled: boolean, reloadKey = 0): State {
	const key = conceptIds.join(",");
	return useAsyncQuestions(
		enabled && conceptIds.length
			? async () => {
					const all = await selectQuestions((q) => q.overlaps("concepts", conceptIds));
					const groups = conceptIds.map((id) =>
						shuffleArray(all.filter((q) => conceptsForQuestion(q).some((c) => c.id === id))),
					);
					const seen = new Set<string>();
					return roundRobin(groups, count * 2)
						.filter((q) => !seen.has(q.id) && seen.add(q.id))
						.slice(0, count)
						.map((q) => ({ ...q, options: shuffleArray(q.options) }));
				}
			: null,
		[key, count, enabled, reloadKey],
	);
}

/** Diagnóstico inicial: preguntas de todas las áreas y niveles, repartidas. */
export function useDiagnosticQuestions(count: number, enabled: boolean, reloadKey = 0): State {
	return useAsyncQuestions(
		enabled
			? async () => {
					const all = shuffleArray(await selectQuestions((q) => q.limit(600)));
					const byArea = new Map<string, QuizQuestion[]>();
					for (const q of all) {
						const area = conceptsForQuestion(q)[0]?.area ?? "JavaScript";
						byArea.set(area, [...(byArea.get(area) ?? []), q]);
					}
					// Dentro de cada área, alterna niveles para medir bien
					const order = ["junior", "semi_senior", "senior"];
					const groups = [...byArea.values()].map((qs) =>
						roundRobin(order.map((lvl) => qs.filter((q) => (q.difficulty ?? "junior") === lvl)), qs.length),
					);
					return roundRobin(groups, count).map((q) => ({ ...q, options: shuffleArray(q.options) }));
				}
			: null,
		[count, enabled, reloadKey],
	);
}
