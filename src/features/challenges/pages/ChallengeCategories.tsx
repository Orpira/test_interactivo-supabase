import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useChallengeStore } from "@/store/challengeStore";
import Editor from "@/features/editor/Editor";
import { LEVEL_LABEL, toEditorLanguage } from "@/features/editor/languages";
import { getSolvedChallenges } from "../progress";

const CATEGORIES = [
	{ slug: "html", label: "HTML", blurb: "Semántica, formularios y accesibilidad" },
	{ slug: "css", label: "CSS", blurb: "Flexbox, grid, responsive y temas" },
	{ slug: "javascript", label: "JavaScript", blurb: "Funciones, DOM, asincronía y seguridad" },
	{ slug: "accesibilidad", label: "Accesibilidad", blurb: "Pasa una auditoría WCAG real (axe-core)" },
	{ slug: "seguridad", label: "Seguridad", blurb: "Explota el fallo y después parchéalo" },
	{ slug: "rendimiento", label: "Rendimiento", blurb: "CLS, peticiones, DOM: mide antes y después" },
] as const;

const LEVEL_ORDER = ["junior", "semi_senior", "senior"];

/**
 * /editor: categorías y lista de retos. Con ?code=... (desde el historial)
 * abre el editor libre con ese código.
 */
export default function ChallengeCategories() {
	const [searchParams, setSearchParams] = useSearchParams();
	const { challenges, fetchChallenges } = useChallengeStore();
	const selected = searchParams.get("categoria") ?? "html";
	const sharedCode = searchParams.get("code");
	const [filter, setFilter] = useState("");
	const solved = useMemo(() => getSolvedChallenges(), []);

	useEffect(() => {
		void fetchChallenges();
	}, [fetchChallenges]);

	if (sharedCode !== null) {
		return (
			<section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
				<h1 className="mb-4 text-2xl font-bold">Editor libre</h1>
				<Editor starterCode={sharedCode} language={toEditorLanguage(searchParams.get("language"))} />
			</section>
		);
	}

	const list = challenges
		.filter((c) => c.category === selected)
		.filter((c) =>
			`${c.title} ${c.concepts.join(" ")} ${LEVEL_LABEL[c.difficulty]}`
				.toLowerCase()
				.includes(filter.toLowerCase()),
		)
		.sort((a, b) => LEVEL_ORDER.indexOf(a.difficulty) - LEVEL_ORDER.indexOf(b.difficulty));

	return (
		<section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
			<p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">Retos</p>
			<h1 className="mt-1 text-3xl font-bold">Aprende haciendo</h1>
			<p className="mt-2 max-w-2xl text-muted">
				Cada reto se corrige por comportamiento: da igual cómo lo escribas, si funciona, pasa los tests.
			</p>

			<div role="tablist" aria-label="Tema" className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
				{CATEGORIES.map((cat) => {
					const all = challenges.filter((c) => c.category === cat.slug);
					const done = all.filter((c) => solved.has(c.id)).length;
					const active = selected === cat.slug;
					return (
						<button
							key={cat.slug}
							type="button"
							role="tab"
							aria-selected={active}
							onClick={() => setSearchParams({ categoria: cat.slug })}
							className={`flex items-center gap-4 rounded-xl border p-4 text-left transition ${
								active ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-accent/60"
							}`}
						>
							<img src={`/icons/${cat.slug}.svg`} alt="" className="h-10 w-10" />
							<span>
								<span className="block font-display text-lg font-bold">{cat.label}</span>
								<span className="block text-sm text-muted">{cat.blurb}</span>
								<span className="mt-1 block font-mono text-xs text-muted">
									{done}/{all.length} superados
								</span>
							</span>
						</button>
					);
				})}
			</div>

			<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<h2 className="text-xl font-semibold">
					Retos de {CATEGORIES.find((c) => c.slug === selected)?.label}
				</h2>
				<label className="sr-only" htmlFor="buscar-reto">Buscar reto</label>
				<input
					id="buscar-reto"
					type="search"
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
					placeholder="Buscar por título, concepto o nivel…"
					className="min-h-touch w-full rounded-md border border-line bg-surface px-3 text-fg placeholder:text-muted sm:w-72"
				/>
			</div>

			{list.length === 0 ? (
				<p className="mt-6 text-center text-muted">No hay retos para esta búsqueda.</p>
			) : (
				<ul className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
					{list.map((c) => (
						<li key={c.id}>
							<Link
								to={`/editor/${c.category}/${c.id}`}
								className="flex min-h-touch items-center justify-between gap-3 px-4 py-3 hover:bg-surface2"
							>
								<span className="flex items-center gap-3">
									{solved.has(c.id) ? (
										<CheckCircle2 className="h-5 w-5 shrink-0 text-accent" aria-label="Superado" />
									) : (
										<span className="h-5 w-5 shrink-0 rounded-full border-2 border-line" aria-hidden="true" />
									)}
									<span>
										<span className="block font-medium">{c.title}</span>
										<span className="block font-mono text-xs text-muted">{c.concepts.join(" · ")}</span>
									</span>
								</span>
								<span className="shrink-0 rounded-full border border-line px-2.5 py-0.5 font-mono text-xs text-muted">
									{LEVEL_LABEL[c.difficulty]}
								</span>
							</Link>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
