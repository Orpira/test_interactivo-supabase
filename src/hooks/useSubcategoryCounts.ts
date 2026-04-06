import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { getCategoryVariants } from "@/utils/categoryVariants";

export type SubcategoryCount = {
	slug: string;
	count: number;
};

export function useSubcategoryCounts(
	category: string,
	subcategories: { slug: string }[],
) {
	const [counts, setCounts] = useState<Record<string, number>>({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;
		async function fetchCounts() {
			setLoading(true);
			const slugs = subcategories.map((s) => s.slug);
			const categoryVariants = getCategoryVariants(category);
			const { data, error } = await supabase
				.from("questions")
				.select("subcategory, count:subcategory", {
					count: "exact",
					head: false,
				})
				.in("category", categoryVariants)
				.in("subcategory", slugs);
			if (!error && data && isMounted) {
				// data es un array de objetos { subcategory, count }
				const countsObj: Record<string, number> = {};
				slugs.forEach((slug) => {
					const found = data.find((d: any) => d.subcategory === slug);
					countsObj[slug] = found ? found.count : 0;
				});
				setCounts(countsObj);
			}
			setLoading(false);
		}
		fetchCounts();
		return () => {
			isMounted = false;
		};
	}, [category, JSON.stringify(subcategories)]);

	return { counts, loading };
}
