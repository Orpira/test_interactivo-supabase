import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import {
	CornerDownLeft,
	LogIn,
	LogOut,
	Moon,
	Puzzle,
	Search,
	Sun,
	type LucideIcon,
} from "lucide-react";
import type { ChallengeSpec } from "@/features/challenges/engine/types";
import { applyTheme, getStoredTheme } from "@/services/theme";
import { NAV_PAGES, QUIZ_CATEGORIES, normalize } from "./navData";

type Item = {
	id: string;
	group: "Ir a" | "Quizzes" | "Retos" | "Acciones";
	label: string;
	hint?: string;
	icon: LucideIcon;
	keywords: string;
	run: () => void;
};

type Props = {
	open: boolean;
	onClose: () => void;
	isAuthenticated: boolean;
	onStartQuiz: (categoryKey: string) => void;
	onLogin: () => void;
	onLogout: () => void;
};

/**
 * Paleta de comandos (Ctrl/⌘ + K): navega a cualquier página, empieza un quiz
 * o abre un reto escribiendo unas letras. Accesible con teclado (combobox).
 */
export default function CommandPalette({
	open,
	onClose,
	isAuthenticated,
	onStartQuiz,
	onLogin,
	onLogout,
}: Props) {
	const navigate = useNavigate();
	const reduceMotion = useReducedMotion();
	const [query, setQuery] = useState("");
	const [active, setActive] = useState(0);
	const [challenges, setChallenges] = useState<ChallengeSpec[]>([]);
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLUListElement>(null);

	// El catálogo de retos se carga solo al abrir la paleta
	useEffect(() => {
		if (!open || challenges.length || !isAuthenticated) return;
		void import("@/content/challenges").then((m) =>
			setChallenges(m.challengeCatalog)
		);
	}, [open, challenges.length, isAuthenticated]);

	useEffect(() => {
		if (open) {
			setQuery("");
			setActive(0);
			requestAnimationFrame(() => inputRef.current?.focus());
		}
	}, [open]);

	const items = useMemo<Item[]>(() => {
		const go = (to: string) => () => {
			onClose();
			navigate(to);
		};
		const theme = getStoredTheme();
		const base: Item[] = [
			...NAV_PAGES.filter((p) => !p.private || isAuthenticated).map((p) => ({
				id: `page:${p.to}`,
				group: "Ir a" as const,
				label: p.label,
				icon: p.icon,
				keywords: p.keywords ?? "",
				run: go(p.to),
			})),
			...QUIZ_CATEGORIES.map((c) => ({
				id: `quiz:${c.key}`,
				group: "Quizzes" as const,
				label: `Quiz de ${c.label}`,
				hint: c.desc,
				icon: c.icon,
				keywords: `${c.desc} preguntas test`,
				run: () => {
					onClose();
					onStartQuiz(c.key);
				},
			})),
			...challenges.map((c) => ({
				id: `reto:${c.id}`,
				group: "Retos" as const,
				label: c.title,
				hint: `${c.category.toUpperCase()} · ${c.concepts.join(", ")}`,
				icon: Puzzle,
				keywords: `${c.category} ${c.concepts.join(" ")} ${c.difficulty}`,
				run: go(`/editor/${c.category}/${c.id}`),
			})),
			{
				id: "action:theme",
				group: "Acciones",
				label:
					theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro",
				icon: theme === "dark" ? Sun : Moon,
				keywords: "tema modo oscuro claro dark light apariencia",
				run: () => {
					applyTheme(theme === "dark" ? "light" : "dark");
					onClose();
				},
			},
			isAuthenticated
				? {
						id: "action:logout",
						group: "Acciones",
						label: "Cerrar sesión",
						icon: LogOut,
						keywords: "salir logout",
						run: () => {
							onClose();
							onLogout();
						},
				  }
				: {
						id: "action:login",
						group: "Acciones",
						label: "Iniciar sesión o crear cuenta",
						icon: LogIn,
						keywords: "entrar registrarse login cuenta",
						run: () => {
							onClose();
							onLogin();
						},
				  },
		];
		const terms = normalize(query).split(/\s+/).filter(Boolean);
		if (!terms.length) return base.filter((i) => i.group !== "Retos");
		return base
			.filter((i) => {
				const text = normalize(`${i.label} ${i.hint ?? ""} ${i.keywords}`);
				return terms.every((t) => text.includes(t));
			})
			.slice(0, 40);
	}, [
		query,
		challenges,
		isAuthenticated,
		navigate,
		onClose,
		onStartQuiz,
		onLogin,
		onLogout,
	]);

	useEffect(() => setActive(0), [query]);

	useEffect(() => {
		listRef.current
			?.querySelector<HTMLElement>(`[data-index="${active}"]`)
			?.scrollIntoView?.({ block: "nearest" });
	}, [active]);

	const onKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setActive((i) => Math.min(i + 1, items.length - 1));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setActive((i) => Math.max(i - 1, 0));
		} else if (e.key === "Enter") {
			e.preventDefault();
			items[active]?.run();
		} else if (e.key === "Escape") {
			e.preventDefault();
			onClose();
		}
	};

	let lastGroup = "";

	return (
		<AnimatePresence>
			{open && (
				<m.div
					role="region"
					aria-label="Búsqueda"
					className="fixed inset-0 z-[70] flex items-start justify-center bg-bg/70 px-4 pt-[12vh] backdrop-blur-sm"
					initial={reduceMotion ? false : { opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onMouseDown={(e) => e.target === e.currentTarget && onClose()}
				>
					<m.div
						role="dialog"
						aria-modal="true"
						aria-label="Buscar y navegar"
						initial={reduceMotion ? false : { opacity: 0, y: -12, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -8, scale: 0.98 }}
						transition={{ duration: 0.16 }}
						className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_30px_80px_-20px_rgb(0_0_0/0.6)]"
					>
						<div className="flex items-center gap-3 border-b border-line px-4">
							<Search
								className="h-5 w-5 shrink-0 text-muted"
								aria-hidden="true"
							/>
							<input
								ref={inputRef}
								autoFocus
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								onKeyDown={onKeyDown}
								placeholder="Busca una página, un quiz o un reto…"
								role="combobox"
								aria-expanded="true"
								aria-controls="palette-list"
								aria-activedescendant={
									items[active] ? `palette-${active}` : undefined
								}
								aria-autocomplete="list"
								className="min-h-14 w-full bg-transparent text-base text-fg outline-none placeholder:text-muted"
							/>
							<kbd className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-[0.7rem] text-muted sm:block">
								Esc
							</kbd>
						</div>
						<ul
							id="palette-list"
							ref={listRef}
							role="listbox"
							className="max-h-[50vh] overflow-y-auto p-2"
						>
							{items.length === 0 && (
								<li className="px-3 py-8 text-center text-sm text-muted">
									Sin resultados para «{query}»
								</li>
							)}
							{items.map((item, i) => {
								const header = item.group !== lastGroup ? item.group : null;
								lastGroup = item.group;
								const Icon = item.icon;
								return (
									<li key={item.id} role="presentation">
										{header && (
											<p className="px-3 pb-1 pt-3 font-mono text-[0.65rem] font-semibold uppercase tracking-widest text-muted">
												{header}
											</p>
										)}
										<div
											id={`palette-${i}`}
											data-index={i}
											role="option"
											aria-selected={i === active}
											onMouseMove={() => setActive(i)}
											onClick={item.run}
											className={`flex min-h-touch cursor-pointer items-center gap-3 rounded-lg px-3 py-2 ${
												i === active ? "bg-accent-soft text-fg" : "text-fg"
											}`}
										>
											<span
												className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
													i === active
														? "border-accent/50 text-accent"
														: "border-line text-muted"
												}`}
											>
												<Icon className="h-4 w-4" aria-hidden="true" />
											</span>
											<span className="min-w-0 flex-1">
												<span className="block truncate text-sm font-medium">
													{item.label}
												</span>
												{item.hint && (
													<span className="block truncate font-mono text-xs text-muted">
														{item.hint}
													</span>
												)}
											</span>
											{i === active && (
												<CornerDownLeft
													className="h-4 w-4 text-accent"
													aria-hidden="true"
												/>
											)}
										</div>
									</li>
								);
							})}
						</ul>
						<div className="flex items-center gap-4 border-t border-line px-4 py-2 font-mono text-[0.7rem] text-muted">
							<span>↑↓ moverse</span>
							<span>Enter abrir</span>
							<span className="ml-auto">Ctrl K</span>
						</div>
					</m.div>
				</m.div>
			)}
		</AnimatePresence>
	);
}
