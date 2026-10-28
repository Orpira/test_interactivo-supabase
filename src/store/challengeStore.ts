import { create } from "zustand";
import { supabase } from "@/services/supabase";

export type Challenge = {
	id: string;
	title: string;
	instructions: string;
	category: string;
	difficulty?: string;
	starterCode?: string;
	initialCode?: string;
	expectedOutput?: string;
};

interface ChallengeStore {
	challenges: Challenge[];
	loading: boolean;
	loaded: boolean;
	error: string | null;
	fetchChallenges: () => Promise<void>;
	getChallengeById: (id: string) => Challenge | undefined;
	getByCategory: (category: string) => Challenge[];
}

// Orden natural: "html-2" antes que "html-10"
const byId = (a: Challenge, b: Challenge) =>
	a.id.localeCompare(b.id, undefined, { numeric: true });

export const useChallengeStore = create<ChallengeStore>((set, get) => ({
	challenges: [],
	loading: false,
	loaded: false,
	error: null,
	fetchChallenges: async () => {
		if (get().loading) return;
		set({ loading: true, error: null });
		const { data, error } = await supabase.from("challenges").select("*");
		if (error) {
			console.error("Error cargando challenges:", error);
			set({ loading: false, loaded: true, error: error.message });
			return;
		}
		const challenges: Challenge[] = (data ?? [])
			.map((row: Record<string, unknown>) => ({
				id: String(row.id),
				title: String(row.title ?? ""),
				instructions: String(row.instructions ?? ""),
				category: String(row.category ?? "").toLowerCase(),
				difficulty: (row.difficulty as string) ?? undefined,
				starterCode: (row.starterCode as string) ?? undefined,
				initialCode: (row.initialCode as string) ?? undefined,
				expectedOutput: (row.expectedOutput as string) ?? undefined,
			}))
			.sort(byId);
		set({ challenges, loading: false, loaded: true });
	},
	getChallengeById: (id) => get().challenges.find((c) => c.id === id),
	getByCategory: (category) =>
		get().challenges.filter((c) => c.category === category.toLowerCase()),
}));
