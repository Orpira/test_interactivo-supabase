import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { useChallengeStore } from "@/store/challengeStore";
import Editor from "@/features/editor/Editor";

const CATEGORIES = [
	{ slug: "html", label: "HTML" },
	{ slug: "css", label: "CSS" },
	{ slug: "javascript", label: "JavaScript" },
] as const;

const DIFFICULTY_STYLES: Record<string, string> = {
	principiante: "bg-green-100 text-green-800",
	intermedio: "bg-yellow-100 text-yellow-800",
	avanzado: "bg-red-100 text-red-800",
};

/**
 * Página /editor:
 *  - Con ?code=... (desde el historial) abre el editor libre con ese código.
 *  - Sin parámetros muestra las categorías y la lista de retos de cada una.
 */
export default function ChallengeCategories() {
	const [searchParams, setSearchParams] = useSearchParams();
	const { challenges, loading, loaded, error, fetchChallenges } =
		useChallengeStore();

	const selected = searchParams.get("categoria");
	const sharedCode = searchParams.get("code");
	const [filter, setFilter] = useState("");

	useEffect(() => {
		if (!loaded) fetchChallenges();
	}, [loaded, fetchChallenges]);

	if (sharedCode !== null) {
		return (
			<section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
				<h1 className="mb-4 text-2xl font-bold">Editor libre</h1>
				<Editor
					starterCode={sharedCode}
					categoryFromChallenge={searchParams.get("language") ?? "html"}
				/>
			</section>
		);
	}

	const list = selected
		? challenges
				.filter((c) => c.category === selected)
				.filter((c) =>
					`${c.title} ${c.difficulty ?? ""}`
						.toLowerCase()
						.includes(filter.toLowerCase())
				)
		: [];

	return (
		<section className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
			<h1 className="mb-6 text-center text-3xl font-bold">Retos de código</h1>

			<div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
				{CATEGORIES.map((cat) => {
					const count = challenges.filter(
						(c) => c.category === cat.slug
					).length;
					const active = selected === cat.slug;
					return (
						<motion.button
							type="button"
							key={cat.slug}
							whileHover={{ y: -6 }}
							onClick={() => setSearchParams({ categoria: cat.slug })}
							aria-pressed={active}
							className={`rounded-xl p-6 text-left shadow-2xl transition-transform ${
								active
									? "bg-indigo-50 ring-2 ring-indigo-500"
									: "bg-gray-50/80 hover:scale-105"
							}`}
						>
							<img
								src={`/icons/${cat.slug}.svg`}
								alt=""
								className="mb-4 h-12"
							/>
							<h2 className="mb-2 text-xl font-bold">{cat.label}</h2>
							<p className="text-sm text-slate-700">
								{loading
									? "Cargando retos..."
									: `${count} ${count === 1 ? "reto" : "retos"} disponibles`}
							</p>
						</motion.button>
					);
				})}
			</div>

			{error && (
				<p className="mt-6 rounded border border-red-200 bg-red-50 p-2 text-center text-red-600">
					No se pudieron cargar los retos: {error}
				</p>
			)}

			{selected && !loading && (
				<div className="mt-8">
					<div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<h2 className="text-xl font-semibold">
							Retos de {CATEGORIES.find((c) => c.slug === selected)?.label}
						</h2>
						<input
							type="search"
							value={filter}
							onChange={(e) => setFilter(e.target.value)}
							placeholder="Buscar por título o dificultad..."
							className="w-full rounded border px-3 py-2 sm:w-64"
						/>
					</div>
					{list.length === 0 ? (
						<p className="text-center text-gray-600">
							No hay retos para esta selección.
						</p>
					) : (
						<ul className="divide-y rounded-lg border bg-white">
							{list.map((c) => (
								<li key={c.id}>
									<Link
										to={`/editor/${c.category}/${c.id}`}
										className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-indigo-50"
									>
										<span className="font-medium">{c.title}</span>
										{c.difficulty && (
											<span
												className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
													DIFFICULTY_STYLES[c.difficulty] ?? "bg-gray-100"
												}`}
											>
												{c.difficulty}
											</span>
										)}
									</Link>
								</li>
							))}
						</ul>
					)}
				</div>
			)}
		</section>
	);
}
