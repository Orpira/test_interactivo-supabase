import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useAuth } from "../../services/auth";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { supabase } from "@/services/supabase";
import QuizCategoryModal from "./QuizCategoryModal";
import ThemeToggle from "./ThemeToggle";
import UserMenu, { Avatar } from "../nav/UserMenu";
import QuizMenu, { ActivePill } from "../nav/QuizMenu";
import { NAV_PAGES, QUIZ_CATEGORIES } from "../nav/navData";
import { getCategoryVariants } from "@/utils/categoryVariants";
import {
	getStoredExperienceLevel,
	setStoredExperienceLevel,
	upsertUserExperience,
	type ExperienceLevel,
} from "@/services/feedback";
import { LogIn, LogOut, Menu, Search, X } from "lucide-react";

type SubcategoryOption = {
	name: string;
	slug: string;
	questionCount: number;
};

// Carga diferida: no pesan en la carga inicial de la app, pero se precargan
// cuando el navegador queda libre para que abran al instante.
const loadLoginModal = () => import("./LoginModal");
const loadCommandPalette = () => import("../nav/CommandPalette");
const LoginModal = lazy(loadLoginModal);
const CommandPalette = lazy(loadCommandPalette);

function whenIdle(fn: () => void) {
	const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
	if (w.requestIdleCallback) w.requestIdleCallback(fn);
	else setTimeout(fn, 1500);
}

const MAIN_CATEGORIES = QUIZ_CATEGORIES.map(({ key, label }) => ({
	key,
	label,
}));

export default function Navbar() {
	const { isAuthenticated, user, logout } = useAuth();
	const location = useLocation();
	const navigate = useNavigate();
	const autoOpenedCategoryRef = useRef("");
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState("");
	const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
	const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
	const [subcategoriesError, setSubcategoriesError] = useState("");
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [paletteOpen, setPaletteOpen] = useState(false);
	const [paletteMounted, setPaletteMounted] = useState(false);
	const [scrolled, setScrolled] = useState(false);
	const reduceMotion = useReducedMotion();
	const [showExperiencePicker, setShowExperiencePicker] = useState(false);
	const [pendingCategory, setPendingCategory] = useState<string | null>(null);

	const userDisplayName =
		user?.user_metadata?.full_name ||
		user?.user_metadata?.name ||
		user?.email?.split("@")[0] ||
		"Usuario";
	const userInitial = userDisplayName.charAt(0).toUpperCase();

	function requestCategory(categoryKey: string) {
		setPendingCategory(categoryKey);
		setShowExperiencePicker(true);
	}

	async function handleExperienceSelect(level: ExperienceLevel) {
		setStoredExperienceLevel(level);
		setShowExperiencePicker(false);

		if (user?.id) {
			try {
				await upsertUserExperience(user.id, level);
			} catch (err) {
				console.error("No se pudo guardar la experiencia:", err);
			}
		}

		if (pendingCategory) {
			const cat = pendingCategory;
			setPendingCategory(null);
			void handleCategoryClick(cat);
		}
	}

	async function handleCategoryClick(categoryKey: string) {
		setSelectedCategory(categoryKey);
		setShowSubcategoryModal(true);
		setSubcategories([]);
		setSubcategoriesError("");
		setSubcategoriesLoading(true);

		try {
			const categoryVariants = getCategoryVariants(categoryKey);
			const difficulty = getStoredExperienceLevel() ?? "junior";
			let query = supabase
				.from("questions")
				.select("subcategory")
				.in("category", categoryVariants);

			query = query.eq("difficulty", difficulty);

			const { data, error } = await query;

			if (error) throw error;

			const counts = (data ?? []).reduce<Record<string, number>>((acc, row) => {
				const value = (row as { subcategory?: string }).subcategory;
				if (!value) return acc;
				acc[value] = (acc[value] || 0) + 1;
				return acc;
			}, {});

			const mapped = Object.keys(counts)
				.map((name) => ({
					name,
					slug: encodeURIComponent(name),
					questionCount: counts[name],
				}))
				.sort((a, b) => b.questionCount - a.questionCount);

			setSubcategories(mapped);
			if (mapped.length === 0) {
				setSubcategoriesError(
					"No hay subcategorias disponibles en esta categoria."
				);
			}
		} catch (err) {
			setSubcategoriesError(
				errorMessage(err, "No se pudieron cargar las subcategorías.")
			);
		} finally {
			setSubcategoriesLoading(false);
		}
	}

	function handleStartQuiz(subcat: string, count: number) {
		setShowSubcategoryModal(false);
		navigate(
			`/quiz/${selectedCategory}/${encodeURIComponent(subcat)}?count=${count}`
		);
	}

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const categoryFromQuery = params.get("quizCategory");
		if (!categoryFromQuery) {
			autoOpenedCategoryRef.current = "";
			return;
		}

		const decodedCategory = decodeURIComponent(categoryFromQuery);
		if (autoOpenedCategoryRef.current === decodedCategory) return;
		if (!MAIN_CATEGORIES.some((cat) => cat.key === decodedCategory)) return;

		autoOpenedCategoryRef.current = decodedCategory;
		requestCategory(decodedCategory);
	}, [location.search]);

	useEffect(() => {
		setMobileMenuOpen(false);
	}, [location.pathname, location.search]);

	useEffect(() => {
		whenIdle(() => {
			void loadCommandPalette();
			if (!isAuthenticated) void loadLoginModal();
		});
	}, [isAuthenticated]);

	// Ctrl/⌘ + K abre la paleta de comandos desde cualquier pantalla
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				setPaletteMounted(true);
				setPaletteOpen((v) => !v);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	// Sombra y fondo más opaco al hacer scroll
	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 8);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	useEffect(() => {
		if (!isAuthenticated) return;

		setShowLoginModal(false);
		setMobileMenuOpen(false);
	}, [isAuthenticated]);

	function handleCategoryClickFromMenu(categoryKey: string) {
		setMobileMenuOpen(false);
		requestCategory(categoryKey);
	}

	const visiblePages = NAV_PAGES.filter(
		(p) =>
			(!p.private || isAuthenticated) &&
			!(p.publicOnly && isAuthenticated) &&
			!["/dashboard", "/historial", "/mapa", "/practicar"].includes(p.to)
	);
	const isActive = (to: string) =>
		to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
	const quizActive =
		location.pathname.startsWith("/quiz") || location.pathname === "/result";

	return (
		<>
			<header
				className={`sticky top-0 z-50 border-b transition-colors ${
					scrolled
						? "border-line bg-bg/85 shadow-[0_8px_30px_-12px_rgb(0_0_0/0.45)]"
						: "border-transparent bg-bg/60"
				} backdrop-blur-xl`}
			>
				<nav
					aria-label="Principal"
					className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6"
				>
					<Link to="/" className="group flex items-center gap-2.5 rounded-lg">
						<span className="relative">
							<span
								className="absolute inset-0 rounded-full bg-accent/30 blur-md transition group-hover:bg-accent/50"
								aria-hidden="true"
							/>
							<img
								src="/logo-96.webp"
								alt=""
								width="36"
								height="36"
								className="relative h-9 w-9"
							/>
						</span>
						<span className="font-display text-lg font-bold tracking-tight">
							WebWiz
						</span>{" "}
						<span className="hidden rounded-md border border-accent/40 px-1.5 font-mono text-[0.6rem] uppercase tracking-widest text-accent sm:inline">
							quiz
						</span>
						<span className="sr-only">: ir al inicio</span>
					</Link>

					{/* Escritorio: enlaces en una cápsula con indicador deslizante */}
					<div className="ml-6 hidden items-center rounded-full border border-line bg-surface/70 p-1 lg:flex">
						{visiblePages.slice(0, 1).map((p) => (
							<NavPill
								key={p.to}
								to={p.to}
								label={p.label}
								active={isActive(p.to) && !quizActive}
							/>
						))}
						<QuizMenu active={quizActive} onSelect={requestCategory} />
						{visiblePages.slice(1).map((p) => (
							<NavPill
								key={p.to}
								to={p.to}
								label={p.label}
								active={isActive(p.to)}
							/>
						))}
					</div>

					<div className="ml-auto flex items-center gap-2">
						<button
							type="button"
							onClick={() => {
								setPaletteMounted(true);
								setPaletteOpen(true);
							}}
							title="Buscar (Ctrl+K)"
							className="flex min-h-touch min-w-touch items-center justify-center gap-2 rounded-full border border-line bg-surface/70 px-3 text-sm text-muted transition hover:border-accent/60 hover:text-fg md:min-w-[12rem] md:justify-start"
						>
							<Search className="h-4 w-4" aria-hidden="true" />
							<span className="sr-only md:not-sr-only">Buscar…</span>
							<kbd
								aria-hidden="true"
								className="ml-auto hidden rounded border border-line px-1.5 font-mono text-[0.65rem] md:inline"
							>
								Ctrl K
							</kbd>
						</button>
						<ThemeToggle className="hidden rounded-full sm:inline-flex" />
						{isAuthenticated ? (
							<div className="hidden lg:block">
								<UserMenu
									name={userDisplayName}
									email={user?.email}
									onLogout={() => void logout()}
								/>
							</div>
						) : (
							<button
								type="button"
								onClick={() => setShowLoginModal(true)}
								className="hidden min-h-touch items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-fg shadow-[0_8px_24px_-10px_rgb(var(--accent)/0.8)] transition hover:-translate-y-px hover:bg-accent/90 lg:inline-flex"
							>
								<LogIn className="h-4 w-4" aria-hidden="true" />
								Iniciar sesión
							</button>
						)}
						<button
							type="button"
							className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-full border border-line bg-surface/70 text-fg lg:hidden"
							onClick={() => setMobileMenuOpen((prev) => !prev)}
							aria-expanded={mobileMenuOpen}
							aria-controls="mobile-menu"
							aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
						>
							{isAuthenticated && !mobileMenuOpen ? (
								<Avatar initial={userInitial} />
							) : mobileMenuOpen ? (
								<X className="h-5 w-5" aria-hidden="true" />
							) : (
								<Menu className="h-5 w-5" aria-hidden="true" />
							)}
						</button>
					</div>
				</nav>
				{/* Línea de marca */}
				<div
					aria-hidden="true"
					className="h-px w-full bg-gradient-to-r from-transparent via-accent/60 to-transparent"
				/>

				{/* Móvil: panel desplegable */}
				<AnimatePresence>
					{mobileMenuOpen && (
						<m.nav
							id="mobile-menu"
							aria-label="Menú móvil"
							initial={reduceMotion ? false : { opacity: 0, y: -8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							transition={{ duration: 0.16 }}
							className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-line bg-bg/95 px-4 pb-5 pt-3 backdrop-blur-xl lg:hidden"
						>
							{isAuthenticated && (
								<div className="mb-3 flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
									<Avatar initial={userInitial} size="lg" />
									<div className="min-w-0">
										<p className="truncate font-semibold">{userDisplayName}</p>
										<p className="truncate text-xs text-muted">{user?.email}</p>
									</div>
								</div>
							)}
							<ul className="grid gap-1">
								{NAV_PAGES.filter((p) => (!p.private || isAuthenticated) && !(p.publicOnly && isAuthenticated)).map(
									({ to, label, icon: Icon }) => (
										<li key={to}>
											<NavLink
												to={to}
												end={to === "/"}
												className={({ isActive: a }) =>
													`flex min-h-12 items-center gap-3 rounded-xl px-3 font-medium ${
														a
															? "bg-accent-soft text-accent"
															: "text-fg hover:bg-surface2"
													}`
												}
											>
												<Icon className="h-5 w-5" aria-hidden="true" />
												{label}
											</NavLink>
										</li>
									)
								)}
							</ul>
							<p className="mb-2 mt-4 px-1 font-mono text-[0.65rem] font-semibold uppercase tracking-widest text-muted">
								Quizzes
							</p>
							<div className="grid grid-cols-2 gap-2">
								{QUIZ_CATEGORIES.map(({ key, label, icon: Icon }) => (
									<button
										key={key}
										type="button"
										onClick={() => handleCategoryClickFromMenu(key)}
										className="flex min-h-12 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-left text-sm font-medium hover:border-accent/60"
									>
										<Icon className="h-4 w-4 text-accent" aria-hidden="true" />
										{label}
									</button>
								))}
							</div>
							<div className="mt-4 flex items-center gap-2">
								<ThemeToggle className="rounded-xl border border-line" />
								{isAuthenticated ? (
									<button
										type="button"
										onClick={() => void logout()}
										className="flex min-h-touch flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface font-medium text-warn"
									>
										<LogOut className="h-4 w-4" aria-hidden="true" />
										Cerrar sesión
									</button>
								) : (
									<button
										type="button"
										onClick={() => setShowLoginModal(true)}
										className="flex min-h-touch flex-1 items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-accent-fg"
									>
										<LogIn className="h-4 w-4" aria-hidden="true" />
										Iniciar sesión
									</button>
								)}
							</div>
						</m.nav>
					)}
				</AnimatePresence>
			</header>

			{paletteMounted && (
				<Suspense fallback={null}>
					<CommandPalette
						open={paletteOpen}
						onClose={() => setPaletteOpen(false)}
						isAuthenticated={isAuthenticated}
						onStartQuiz={requestCategory}
						onLogin={() => setShowLoginModal(true)}
						onLogout={() => void logout()}
					/>
				</Suspense>
			)}

			{showLoginModal && (
				<Suspense fallback={null}>
					<LoginModal onClose={() => setShowLoginModal(false)} />
				</Suspense>
			)}
			{showExperiencePicker && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 px-4">
					<div className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-2xl">
						<h3 className="text-xl font-bold text-fg text-center mb-2">
							Selecciona tu nivel
						</h3>
						<p className="text-sm text-muted text-center mb-5">
							Las preguntas se adaptarán a tu experiencia
						</p>
						<div className="flex flex-col gap-3">
							{[
								{
									value: "junior" as ExperienceLevel,
									label: "Junior",
									desc: "Estoy comenzando",
								},
								{
									value: "semi_senior" as ExperienceLevel,
									label: "Semi Senior",
									desc: "Tengo experiencia intermedia",
								},
								{
									value: "senior" as ExperienceLevel,
									label: "Senior",
									desc: "Domino los temas avanzados",
								},
							].map((opt) => {
								const current = getStoredExperienceLevel();
								const isActive = current === opt.value;
								return (
									<button
										key={opt.value}
										type="button"
										onClick={() => void handleExperienceSelect(opt.value)}
										className={`w-full rounded-lg border px-4 py-3 text-left transition ${
											isActive
												? "border-accent bg-accent-soft ring-2 ring-accent"
												: "border-line hover:border-accent hover:bg-accent-soft"
										}`}
									>
										<span className="block font-semibold text-fg">
											{opt.label}
											{isActive && (
												<span className="ml-2 text-xs font-normal text-accent">
													(actual)
												</span>
											)}
										</span>
										<span className="block text-sm text-muted">{opt.desc}</span>
									</button>
								);
							})}
						</div>
						<button
							type="button"
							onClick={() => {
								setShowExperiencePicker(false);
								setPendingCategory(null);
							}}
							className="mt-4 w-full text-center text-sm text-muted hover:text-fg"
						>
							Cancelar
						</button>
					</div>
				</div>
			)}
			<QuizCategoryModal
				open={showSubcategoryModal}
				onClose={() => setShowSubcategoryModal(false)}
				category={
					MAIN_CATEGORIES.find((c) => c.key === selectedCategory)?.label ||
					selectedCategory
				}
				subcategories={subcategories}
				loading={subcategoriesLoading}
				error={subcategoriesError}
				onStartQuiz={handleStartQuiz}
			/>
		</>
	);
}

function errorMessage(error: unknown, fallback: string) {
	return (error as { message?: string })?.message || fallback;
}

function NavPill({
	to,
	label,
	active,
}: {
	to: string;
	label: string;
	active: boolean;
}) {
	return (
		<Link
			to={to}
			aria-current={active ? "page" : undefined}
			className={`relative flex min-h-10 items-center rounded-full px-3.5 text-sm font-medium transition-colors ${
				active ? "text-fg" : "text-muted hover:text-fg"
			}`}
		>
			{active && <ActivePill />}
			<span className="relative">{label}</span>
		</Link>
	);
}
