import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../services/auth";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/services/supabase";
import QuizCategoryModal from "./QuizCategoryModal";
import LoginModal from "./LoginModal";
import ThemeToggle from "./ThemeToggle";
import { getCategoryVariants } from "@/utils/categoryVariants";
import {
	getStoredExperienceLevel,
	setStoredExperienceLevel,
	upsertUserExperience,
	type ExperienceLevel,
} from "@/services/feedback";
import { ChevronDown, Menu, X } from "lucide-react";

type SubcategoryOption = {
	name: string;
	slug: string;
	questionCount: number;
};

// Secciones que requieren sesión (rutas protegidas con PrivateRoute)
const PRIVATE_LINKS = [
	{ to: "/editor", label: "Retos" },
	{ to: "/ranking", label: "Ranking" },
	{ to: "/dashboard", label: "Dashboard" },
	{ to: "/historial", label: "Historial" },
];

const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
	isActive ? "text-accent font-semibold" : "hover:text-accent";

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
	`rounded px-2 py-2 ${
		isActive ? "bg-surface2 text-accent" : "hover:bg-surface2"
	}`;

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
	const [mobileQuizOpen, setMobileQuizOpen] = useState(false);
	const [showExperiencePicker, setShowExperiencePicker] = useState(false);
	const [pendingCategory, setPendingCategory] = useState<string | null>(null);

	const MAIN_CATEGORIES = [
		{ key: "frontend", label: "Frontend" },
		{ key: "backend", label: "Backend" },
		{ key: "devops", label: "DevOps" },
		{ key: "testing", label: "Testing" },
	];

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
		setMobileQuizOpen(false);
	}, [location.pathname, location.search]);

	useEffect(() => {
		if (!isAuthenticated) return;

		setShowLoginModal(false);
		setMobileMenuOpen(false);
	}, [isAuthenticated]);

	function handleCategoryClickFromMenu(categoryKey: string) {
		setMobileMenuOpen(false);
		setMobileQuizOpen(false);
		requestCategory(categoryKey);
	}

	return (
		<>
			<nav className="sticky top-0 z-50 border-b border-line bg-surface/95 px-4 py-3 text-fg backdrop-blur-md">
				<div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3">
					<Link
						to="/"
						className="flex items-center gap-2 font-display text-lg font-bold sm:text-xl"
					>
						<img src="/logo.png" alt="Logo" className="w-10 h-10" />
						<span className="hidden sm:inline">WebWiz Quiz</span>
					</Link>

					<div className="ml-auto hidden items-center gap-4 lg:flex xl:gap-5">
						<Link to="/" className="hover:text-accent">
							Inicio
						</Link>
						<div className="relative group">
							<button className="hover:text-accent focus:outline-none flex items-center gap-1">
								Quizzes
								<ChevronDown className="h-4 w-4" aria-hidden="true" />
							</button>
							<div className="absolute left-0 mt-2 w-48 bg-surface text-fg rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity z-40">
								{MAIN_CATEGORIES.map((cat) => (
									<button
										key={cat.key}
										onClick={() => {
											requestCategory(cat.key);
										}}
										className="w-full text-left px-4 py-2 hover:bg-accent-soft"
									>
										{cat.label}
									</button>
								))}
							</div>
						</div>
						{isAuthenticated &&
							PRIVATE_LINKS.map((link) => (
								<NavLink
									key={link.to}
									to={link.to}
									className={desktopLinkClass}
								>
									{link.label}
								</NavLink>
							))}
						<Link to="/contacto" className="hover:text-accent">
							Contacto
						</Link>
						<ThemeToggle />
						{isAuthenticated ? (
							<>
								<span
									className="flex max-w-[12rem] shrink-0 items-center gap-2 font-semibold text-accent"
									title={`${userDisplayName} (${user?.email ?? ""})`}
								>
									<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-fg">
										{userInitial}
									</span>
									<span className="hidden truncate xl:inline">
										{userDisplayName}
									</span>
								</span>
								<button
									type="button"
									onClick={() => void logout()}
									className="min-h-touch rounded-md border border-line bg-surface2 px-4 py-2 font-medium text-fg transition hover:border-accent/60"
								>
									Cerrar sesión
								</button>
							</>
						) : (
							<button
								type="button"
								onClick={() => setShowLoginModal(true)}
								className="min-h-touch rounded-md bg-accent px-4 py-2 font-semibold text-accent-fg transition hover:bg-accent/90"
							>
								Iniciar sesión
							</button>
						)}
					</div>

					{isAuthenticated && (
						<div className="ml-auto flex min-w-0 max-w-[42vw] items-center gap-2 rounded-full border border-accent/30 bg-surface2 px-2.5 py-1 text-fg shadow-sm lg:hidden">
							<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-fg">
								{userInitial}
							</span>
							<span className="truncate text-xs font-semibold">
								{userDisplayName}
							</span>
						</div>
					)}

					<ThemeToggle
						className={`lg:hidden ${isAuthenticated ? "" : "ml-auto"}`}
					/>
					<button
						type="button"
						className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-md border border-line text-fg lg:hidden"
						onClick={() => setMobileMenuOpen((prev) => !prev)}
						aria-expanded={mobileMenuOpen}
						aria-controls="mobile-menu"
						aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
					>
						{mobileMenuOpen ? (
							<X className="h-5 w-5" aria-hidden="true" />
						) : (
							<Menu className="h-5 w-5" aria-hidden="true" />
						)}
					</button>

					{mobileMenuOpen && (
						<nav
							id="mobile-menu"
							aria-label="Menú móvil"
							className="mt-2 w-full border-t border-line pt-3 lg:hidden"
						>
							<div className="flex flex-col gap-2 text-sm">
								<Link to="/" className="rounded px-2 py-2 hover:bg-surface2">
									Inicio
								</Link>
								<button
									type="button"
									onClick={() => setMobileQuizOpen((prev) => !prev)}
									className="flex items-center justify-between rounded px-2 py-2 hover:bg-surface2"
								>
									<span>Quizzes</span>
									<ChevronDown
										className={`h-4 w-4 transition-transform ${
											mobileQuizOpen ? "rotate-180" : ""
										}`}
										aria-hidden="true"
									/>
								</button>
								{mobileQuizOpen && (
									<div className="ml-2 flex flex-col rounded bg-surface2 p-2">
										{MAIN_CATEGORIES.map((cat) => (
											<button
												key={cat.key}
												type="button"
												onClick={() => {
													void handleCategoryClickFromMenu(cat.key);
												}}
												className="rounded px-2 py-2 text-left hover:bg-surface2"
											>
												{cat.label}
											</button>
										))}
									</div>
								)}
								{isAuthenticated &&
									PRIVATE_LINKS.map((link) => (
										<NavLink
											key={link.to}
											to={link.to}
											className={mobileLinkClass}
										>
											{link.label}
										</NavLink>
									))}
								<Link
									to="/contacto"
									className="rounded px-2 py-2 hover:bg-surface2"
								>
									Contacto
								</Link>
								{isAuthenticated ? (
									<>
										<span className="truncate rounded bg-surface2 px-2 py-2 text-accent">
											{userDisplayName}
										</span>
										<button
											type="button"
											onClick={() => void logout()}
											className="rounded bg-warn px-3 py-2 text-left hover:bg-warn/90"
										>
											Cerrar sesión
										</button>
									</>
								) : (
									<button
										type="button"
										onClick={() => setShowLoginModal(true)}
										className="rounded bg-accent px-3 py-2 text-left hover:bg-accent/90"
									>
										Iniciar sesión
									</button>
								)}
							</div>
						</nav>
					)}
				</div>
			</nav>
			{showLoginModal && (
				<LoginModal onClose={() => setShowLoginModal(false)} />
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
										<span className="block text-sm text-muted">
											{opt.desc}
										</span>
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
