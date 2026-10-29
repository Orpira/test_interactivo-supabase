// src/hooks/useUserHistory.ts
import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { useAuth } from "../services/auth";

export type HistoryItem = {
	id: string;
	userId: string;
	name?: string | null;
	score: number;
	total: number;
	category: string;
	subcategory?: string | null;
	subcategoria?: string;
	summary?: Array<{ subcategory?: string; subcategoria?: string }> | null;
	timestamp: string;
	createdAt?: string;
};

export function useUserHistory() {
	const { user } = useAuth();
	const [history, setHistory] = useState<HistoryItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!user?.id) {
			setLoading(false);
			return;
		}

		const loadHistory = async () => {
			setLoading(true);
			setError(null);
			const { data, error } = await supabase
				.from("resultados")
				.select("*")
				.eq("userId", user.id)
				.order("timestamp", { ascending: false });

			if (error) {
				console.error("Error cargando historial:", error);
				setError(error.message || "No se pudo cargar el historial.");
			} else {
				setHistory((data ?? []) as HistoryItem[]);
			}
			setLoading(false);
		};

		loadHistory();
	}, [user?.id]);

	return { history, loading, error };
}
