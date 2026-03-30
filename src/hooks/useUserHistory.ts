// src/hooks/useUserHistory.ts
import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { useAuth } from "../services/auth";

type HistoryItem = { id: string; [key: string]: any };

export function useUserHistory() {
	const { user } = useAuth();
	const [history, setHistory] = useState<HistoryItem[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!user?.id) return;

		const loadHistory = async () => {
			const { data, error } = await supabase
				.from("resultados")
				.select("*")
				.eq("userId", user.id)
				.order("timestamp", { ascending: false });

			if (error) {
				console.error("Error cargando historial:", error);
			} else {
				setHistory(data ?? []);
			}
			setLoading(false);
		};

		loadHistory();
	}, [user?.id]);

	return { history, loading };
}
