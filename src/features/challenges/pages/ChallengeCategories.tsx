import React from "react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase";

type Lang = "HTML" | "CSS" | "JavaScript";

type Category = {
	name: string;
	color: string;
	category: string;
};

interface ChallengeCategoriesProps {
	onCategoryClick?: (cat: { id: string; slug?: string; name?: string }) => void;
	isAuthenticated: boolean;
	onSelectCategory: (categories: Lang) => void;
}

export default function ChallengeCategories({
	onCategoryClick,
	isAuthenticated,
	onSelectCategory,
}: ChallengeCategoriesProps) {
	const [firstChallenges, setFirstChallenges] = useState<{
		[key: string]: string;
	}>({});
	const navigate = useNavigate();

	useEffect(() => {
		async function fetchFirstChallenges() {
			const results: { [key: string]: string } = {};
			for (const category of ["HTML", "CSS", "JavaScript"] as const) {
				const { data } = await supabase
					.from("challenges")
					.select("id")
					.eq("category", category.toLowerCase())
					.limit(1);
				if (data && data[0]) {
					results[category.toLowerCase()] = data[0].id;
				}
			}
			setFirstChallenges(results);
		}
		fetchFirstChallenges();
	}, []);

	return (
		<section className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
			{["HTML", "CSS", "JavaScript"].map((cat) => (
				<motion.article
					key={cat}
					whileHover={isAuthenticated ? { y: -6 } : {}}
					/* ⬇️ Llamamos al padre; si no está log-in el padre
           mostrará el modal y aquí no navegamos */
					onClick={() => onSelectCategory(cat as Lang)}
					className={`
          rounded-xl p-6 bg-gray-50/80 shadow-2xl transition-transform
          ${
						isAuthenticated
							? "cursor-pointer hover:scale-105"
							: "cursor-not-allowed opacity-60"
					}
        `}
				>
					<img
						src={`/icons/${cat.toLowerCase()}.svg`}
						alt={cat}
						className="h-12 mb-4"
					/>
					<h3 className="text-xl font-bold mb-2">{cat}</h3>
					<p className="text-sm text-slate-700">
						Desbloquea 50+ retos desde principiante hasta avanzado.
					</p>
				</motion.article>
			))}
		</section>
	);
}
