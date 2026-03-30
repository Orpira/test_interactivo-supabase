import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export function useQuestions(category: string, count: number = 10) {
	const [questions, setQuestions] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const load = async () => {
			try {
				const { data, error } = await supabase
					.from("questions")
					.select("*")
					.eq("category", category)
					.limit(count);
				if (error) throw error;
				setQuestions(data ?? []);
			} catch (err) {
				console.error("Error cargando preguntas:", err);
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [category, count]);

	return { questions, loading };
}
