import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../services/auth";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/services/supabase";
import QuizCategoryModal from "./QuizCategoryModal";
import { getCategoryVariants } from "@/utils/categoryVariants";
import {
	getStoredExperienceLevel,
	setStoredExperienceLevel,
	upsertUserExperience,
	type ExperienceLevel,
} from "@/services/feedback";
import {
	ChevronDown,
	Github,
	Lock,
	Mail,
	Menu,
	UserCircle,
	X,
} from "lucide-react";

type SubcategoryOption = {
	name: string;
	slug: string;
	questionCount: number;
};

export default function Navbar() {
	const { isAuthenticated, loginWithRedirect, loginWithGoogle, user, logout } =
		useAuth();
	const location = useLocation();
	const navigate = useNavigate();
	const autoOpenedCategoryRef = useRef("");
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
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

	async function handleEmailLogin(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});
			if (error) setError(error.message);
			else setShowLoginModal(false);
		} catch (err) {
			setError(errorMessage(err, "Error desconocido"));
		} finally {
			setLoading(false);
		}
	}

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
			<nav className="sticky top-0 z-50 bg-slate-900 text-white px-4 py-3 shadow-md backdrop-blur-md">
				<div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3">
					<Link
						to="/"
						className="flex items-center gap-2 font-bold text-lg sm:text-xl"
					>
						<img src="/logo.png" alt="Logo" className="w-10 h-10" />
						<span className="hidden sm:inline">WebWiz Quiz</span>
					</Link>

					<div className="ml-auto hidden items-center gap-6 md:flex">
						<Link to="/" className="hover:text-indigo-300">
							Inicio
						</Link>
						<div className="relative group">
							<button className="hover:text-indigo-300 focus:outline-none flex items-center gap-1">
								Quizzes
								<ChevronDown className="h-4 w-4" aria-hidden="true" />
							</button>
							<div className="absolute left-0 mt-2 w-48 bg-white text-slate-900 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity z-40">
								{MAIN_CATEGORIES.map((cat) => (
									<button
										key={cat.key}
										onClick={() => {
											requestCategory(cat.key);
										}}
										className="w-full text-left px-4 py-2 hover:bg-indigo-100"
									>
										{cat.label}
									</button>
								))}
							</div>
						</div>
						{isAuthenticated && (
							<Link to="/dashboard" className="hover:text-indigo-300">
								Dashboard
							</Link>
						)}
						<Link to="/contacto" className="hover:text-indigo-300">
							Contacto
						</Link>
						{isAuthenticated ? (
							<>
								<span className="max-w-[14rem] truncate font-semibold text-indigo-200">
									{user?.email}
								</span>
								<button
									onClick={() => void logout()}
									className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded transition"
								>
									Cerrar sesion
								</button>
							</>
						) : (
							<button
								onClick={() => setShowLoginModal(true)}
								className="bg-indigo-400 hover:bg-indigo-300 text-white px-4 py-2 rounded transition"
							>
								Iniciar sesion
							</button>
						)}
					</div>

					{isAuthenticated && (
						<div className="ml-auto flex min-w-0 max-w-[42vw] items-center gap-2 rounded-full border border-indigo-400/30 bg-slate-800 px-2.5 py-1 text-indigo-100 shadow-sm md:hidden">
							<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
								{userInitial}
							</span>
							<span className="truncate text-xs font-semibold">
								{userDisplayName}
							</span>
						</div>
					)}

					<button
						type="button"
						className={`inline-flex items-center justify-center rounded-md border border-slate-700 p-2 text-white md:hidden ${
							isAuthenticated ? "" : "ml-auto"
						}`}
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
							className="mt-2 w-full border-t border-slate-700 pt-3 md:hidden"
						>
							<div className="flex flex-col gap-2 text-sm">
								<Link to="/" className="rounded px-2 py-2 hover:bg-slate-800">
									Inicio
								</Link>
								<button
									type="button"
									onClick={() => setMobileQuizOpen((prev) => !prev)}
									className="flex items-center justify-between rounded px-2 py-2 hover:bg-slate-800"
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
									<div className="ml-2 flex flex-col rounded bg-slate-800/70 p-2">
										{MAIN_CATEGORIES.map((cat) => (
											<button
												key={cat.key}
												type="button"
												onClick={() => {
													void handleCategoryClickFromMenu(cat.key);
												}}
												className="rounded px-2 py-2 text-left hover:bg-slate-700"
											>
												{cat.label}
											</button>
										))}
									</div>
								)}
								{isAuthenticated && (
									<Link
										to="/dashboard"
										className="rounded px-2 py-2 hover:bg-slate-800"
									>
										Dashboard
									</Link>
								)}
								<Link
									to="/contacto"
									className="rounded px-2 py-2 hover:bg-slate-800"
								>
									Contacto
								</Link>
								{isAuthenticated ? (
									<>
										<span className="truncate rounded bg-slate-800 px-2 py-2 text-indigo-200">
											{userDisplayName}
										</span>
										<button
											type="button"
											onClick={() => void logout()}
											className="rounded bg-orange-600 px-3 py-2 text-left hover:bg-orange-500"
										>
											Cerrar sesion
										</button>
									</>
								) : (
									<button
										type="button"
										onClick={() => setShowLoginModal(true)}
										className="rounded bg-indigo-500 px-3 py-2 text-left hover:bg-indigo-400"
									>
										Iniciar sesion
									</button>
								)}
							</div>
						</nav>
					)}
				</div>
			</nav>
			{showLoginModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm">
					<div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">
						<div className="bg-slate-950 px-6 py-6 text-white">
							<div className="flex items-start justify-between gap-4">
								<div>
									<div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 ring-1 ring-indigo-300/30">
										<img src="/logo.png" alt="" className="h-9 w-9" />
									</div>
									<h2 className="text-2xl font-bold">Accede a WebWiz Quiz</h2>
									<p className="mt-2 text-sm leading-6 text-slate-300">
										Guarda tu progreso, consulta tu historial y continúa tus
										retos desde cualquier dispositivo.
									</p>
								</div>
								<button
									type="button"
									className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
									onClick={() => setShowLoginModal(false)}
									aria-label="Cerrar"
								>
									<X className="h-5 w-5" aria-hidden="true" />
								</button>
							</div>
						</div>

						<div className="space-y-5 px-6 py-6">
							<div className="grid gap-3 sm:grid-cols-2">
								<button
									type="button"
									onClick={async () => {
										setLoading(true);
										setError("");
										try {
											await loginWithGoogle();
										} catch (e) {
											setError(errorMessage(e, "No se pudo iniciar sesión"));
										} finally {
											setLoading(false);
										}
									}}
									className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-indigo-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
									disabled={loading}
								>
									<svg className="h-5 w-5 shrink-0" viewBox="0 0 48 48">
										<g>
											<path
												fill="#4285F4"
												d="M44.5 20H24v8.5h11.7C34.7 33.1 29.9 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6.4-6.4C33.5 5.1 28.1 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-8.1 20-21 0-1.3-.1-2.1-.3-3z"
											/>
											<path
												fill="#34A853"
												d="M6.3 14.7l7 5.1C15.1 17.1 19.2 14 24 14c2.7 0 5.2.9 7.2 2.4l6.4-6.4C33.5 5.1 28.1 3 24 3c-7.2 0-13.4 3.1-17.7 8.1z"
											/>
											<path
												fill="#FBBC05"
												d="M24 44c5.9 0 10.7-1.9 14.3-5.1l-6.6-5.4C29.7 35.1 27 36 24 36c-5.8 0-10.7-3.9-12.5-9.3l-7 5.4C7.9 41.1 15.4 44 24 44z"
											/>
											<path
												fill="#EA4335"
												d="M44.5 20H24v8.5h11.7c-1.6 4.1-6.1 7.5-11.7 7.5-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6.4-6.4C33.5 5.1 28.1 3 24 3c-7.2 0-13.4 3.1-17.7 8.1z"
											/>
										</g>
									</svg>
									Google
								</button>
								<button
									type="button"
									onClick={async () => {
										setLoading(true);
										setError("");
										try {
											await loginWithRedirect();
										} catch (e) {
											setError(errorMessage(e, "No se pudo iniciar sesión"));
										} finally {
											setLoading(false);
										}
									}}
									className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
									disabled={loading}
								>
									<Github className="h-5 w-5" aria-hidden="true" />
									GitHub
								</button>
							</div>

							<div className="flex items-center gap-3">
								<div className="h-px flex-1 bg-slate-200" />
								<span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
									o con email
								</span>
								<div className="h-px flex-1 bg-slate-200" />
							</div>

							<form onSubmit={handleEmailLogin} className="space-y-4">
								<label className="block">
									<span className="mb-1.5 block text-sm font-medium text-slate-700">
										Correo electrónico
									</span>
									<div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 transition focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
										<Mail
											className="h-4 w-4 text-slate-400"
											aria-hidden="true"
										/>
										<input
											type="email"
											className="min-h-11 w-full bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
											placeholder="tu@email.com"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											required
											autoFocus
										/>
									</div>
								</label>

								<label className="block">
									<span className="mb-1.5 block text-sm font-medium text-slate-700">
										Contraseña
									</span>
									<div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 transition focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
										<Lock
											className="h-4 w-4 text-slate-400"
											aria-hidden="true"
										/>
										<input
											type="password"
											className="min-h-11 w-full bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
											placeholder="Tu contraseña"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											required
										/>
									</div>
								</label>

								{error && (
									<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
										{error}
									</div>
								)}

								<button
									type="submit"
									className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
									disabled={loading}
								>
									<UserCircle className="h-5 w-5" aria-hidden="true" />
									{loading ? "Ingresando..." : "Ingresar"}
								</button>
							</form>
						</div>
					</div>
				</div>
			)}
			{showExperiencePicker && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
					<div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
						<h3 className="text-xl font-bold text-slate-900 text-center mb-2">
							Selecciona tu nivel
						</h3>
						<p className="text-sm text-slate-600 text-center mb-5">
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
												? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600"
												: "border-slate-200 hover:border-indigo-500 hover:bg-indigo-50"
										}`}
									>
										<span className="block font-semibold text-slate-900">
											{opt.label}
											{isActive && (
												<span className="ml-2 text-xs font-normal text-indigo-600">
													(actual)
												</span>
											)}
										</span>
										<span className="block text-sm text-slate-500">
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
							className="mt-4 w-full text-center text-sm text-slate-500 hover:text-slate-700"
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
