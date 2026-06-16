import { create } from "zustand";
import { supabase } from "@/services/supabase";

export type Challenge = {
	id: string;
	title: string;
	instructions: string;
	category: string;
	starterCode?: string;
	initialCode?: string;
	expectedOutput?: string;
	[key: string]: any;
};

interface ChallengeStore {
	challenges: Challenge[];
	loading: boolean;
	fetchChallenges: () => Promise<void>;
	getChallengeById: (id: string) => Challenge | undefined;
}

export const useChallengeStore = create<ChallengeStore>((set, get) => ({
	challenges: [],
	loading: false,
	fetchChallenges: async () => {
		set({ loading: true });
		const { data, error } = await supabase.from("challenges").select("*");
		if (error) {
			console.error("Error cargando challenges:", error);
			set({ loading: false });
			return;
		}
		const challenges = (data ?? []).map((row) => ({
			id: row.id,
			title: row.title ?? "",
			instructions: row.instructions ?? "",
			category: row.category ?? "",
			starterCode: row.starterCode,
			initialCode: row.initialCode,
			expectedOutput: row.expectedOutput,
			...row,
		})) as Challenge[];
		set({ challenges, loading: false });
	},
	getChallengeById: (id) => {
		return get().challenges.find((c) => c.id === id);
	},
}));
