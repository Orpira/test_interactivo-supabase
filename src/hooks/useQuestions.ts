import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export function useQuestions(
	category: string,
	count: number = 10,
	subcategory?: string,
) {
	const [questions, setQuestions] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const load = async () => {
			try {
				let query = supabase
					.from("questions")
					.select("*")
					.eq("category", category);

				if (subcategory) {
					query = query.eq("subcategory", decodeURIComponent(subcategory));
				}

				const { data, error } = await query.limit(count);
				if (error) throw error;
				setQuestions(data ?? []);
			} catch (err) {
				console.error("Error cargando preguntas:", err);
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [category, count, subcategory]);

	return { questions, loading };
}
