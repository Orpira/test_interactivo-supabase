import { useEffect } from "react";
import { useAuth } from "@/services/auth";
import { pullLearning, pushCard, pushStreak } from "@/services/learningSync";
import { useLearning } from "./store";

/** Al iniciar sesión: adopta el progreso de invitado y lo une con el de Supabase. */
export function useLearningSync() {
	const { user } = useAuth();
	const userId = user?.id ?? null;

	useEffect(() => {
		useLearning.getState().touchStreak();
	}, []);

	useEffect(() => {
		if (!userId) return;
		const store = useLearning.getState();
		const wasGuest = store.owner === null;
		store.setOwner(userId);
		let cancelled = false;
		void pullLearning(userId)
			.then(({ cards, streak }) => {
				if (cancelled) return;
				useLearning.getState().merge(cards, streak);
				// Lo hecho como invitado se sube a la cuenta
				if (wasGuest) {
					const s = useLearning.getState();
					for (const c of Object.values(s.cards)) void pushCard(userId, c);
					void pushStreak(userId, s.streak);
				}
			})
			.catch((e) => console.warn("No se pudo cargar el progreso de aprendizaje:", e));
		return () => {
			cancelled = true;
		};
	}, [userId]);
}
