import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { getCategoryVariants } from "@/utils/categoryVariants";

export function useQuestions(
	category: string,
	count: number = 10,
	subcategory?: string,
) {
	const [questions, setQuestions] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			setError(null);
			try {
				const categoryVariants = getCategoryVariants(category);
				let query = supabase
					.from("questions")
					.select("*")
					.in("category", categoryVariants);

				if (subcategory) {
					query = query.eq("subcategory", decodeURIComponent(subcategory));
				}

				const { data, error } = await query.limit(count);
				if (error) throw error;
				setQuestions(data ?? []);
			} catch (err: any) {
				console.error("Error cargando preguntas:", err);
				setError(err?.message || "No se pudieron cargar las preguntas.");
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [category, count, subcategory]);

	return { questions, loading, error };
}
