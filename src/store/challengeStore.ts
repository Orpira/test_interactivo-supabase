import { create } from "zustand";
import { supabase } from "@/services/supabase";
import { challengeCatalog } from "@/content/challenges";
import { topicChallenges } from "@/content/topics";

const LOCAL = [...challengeCatalog, ...topicChallenges];
import type { ChallengeSpec } from "@/features/challenges/engine/types";

interface ChallengeStore {
	challenges: ChallengeSpec[];
	loading: boolean;
	loaded: boolean;
	fetchChallenges: () => Promise<void>;
}

/**
 * Catálogo de retos. La fuente principal son los retos versionados en el repo
 * (verificados en CI); a ellos se suman los retos con `spec` de la tabla
 * `challenges` que no estén ya incluidos. Los retos antiguos (legacy) no se
 * muestran. Si la migración de la Fase 1 no se ha aplicado, se usan solo los
 * del repo.
 */
export const useChallengeStore = create<ChallengeStore>((set, get) => ({
	challenges: LOCAL,
	loading: false,
	loaded: false,
	fetchChallenges: async () => {
		if (get().loading || get().loaded) return;
		set({ loading: true });
		const extra: ChallengeSpec[] = [];
		try {
			const { data, error } = await supabase
				.from("challenges")
				.select("id, spec")
				.eq("legacy", false)
				.eq("type", "challenge")
				.not("spec", "is", null);
			if (error) throw error;
			const known = new Set(LOCAL.map((c) => c.id));
			for (const row of data ?? []) {
				const spec = row.spec as ChallengeSpec | null;
				if (spec && !known.has(row.id) && Array.isArray(spec.tests)) {
					extra.push({ ...spec, id: row.id });
				}
			}
		} catch (error) {
			console.warn("Retos de Supabase no disponibles; se usan los del repo.", error);
		}
		set({ challenges: [...LOCAL, ...extra], loading: false, loaded: true });
	},
}));
