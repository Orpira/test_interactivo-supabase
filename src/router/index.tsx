import { lazy, Suspense, useEffect } from "react";
import {
	BrowserRouter,
	Link,
	Navigate,
	Routes,
	Route,
	useLocation,
	useNavigate,
} from "react-router-dom";
import { useAuth } from "@/services/auth";
import Hero from "@/features/hero/Hero";
import PrivateRoute from "@/features/auth/PrivateRoute";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";

// Rutas con carga diferida: la portada no descarga recharts, prism, etc.
const QuizRunner = lazy(() => import("@/features/quiz/QuizRunner"));
const Result = lazy(() => import("@/features/quiz/Result"));
const Ranking = lazy(() => import("@/features/ranking/Ranking"));
const Historial = lazy(() => import("@/pages/Historial"));
const ContactForm = lazy(() => import("@/components/ui/ContactForm"));
const Gracias = lazy(() => import("@/pages/Gracias"));
const Summary = lazy(() => import("@/features/quiz/pages/Summary"));
const Dashboard = lazy(() => import("@/features/dashboard/Dashboard"));
const ChallengeCategories = lazy(
	() => import("@/features/challenges/pages/ChallengeCategories")
);
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const IncidentList = lazy(() => import("@/features/incidents/IncidentList"));
const IncidentPage = lazy(() => import("@/features/incidents/IncidentPage"));
const ChallengeEditorPage = lazy(
	() => import("@/features/challenges/pages/ChallengeEditorPage")
);

/**
 * Vuelta del login con Google/GitHub y de los enlaces de email.
 * Hay que esperar a que Supabase canjee el ?code= de la URL antes de salir de
 * aquí: si se redirige al instante, el código se pierde y no hay sesión.
 */
function AuthCallback() {
	const { isLoading, isAuthenticated } = useAuth();
	const params = new URLSearchParams(window.location.search);
	const hash = new URLSearchParams(window.location.hash.slice(1));
	const error =
		params.get("error_description") ?? hash.get("error_description");

	if (error) {
		return (
			<section className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
				<p className="text-5xl">⚠️</p>
				<h1 className="text-2xl font-bold">No se pudo iniciar sesión</h1>
				<p className="text-muted">{error}</p>
				<Link to="/" className="text-accent underline">
					Volver al inicio
				</Link>
			</section>
		);
	}

	if (isLoading) {
		return <p className="p-6 text-center">Iniciando sesión...</p>;
	}

	return <Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />;
}

/** Al abrir el enlace de recuperación, lleva al formulario de nueva contraseña. */
function PasswordRecoveryRedirect() {
	const { passwordRecovery } = useAuth();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	useEffect(() => {
		if (passwordRecovery && pathname !== "/restablecer") {
			navigate("/restablecer", { replace: true });
		}
	}, [passwordRecovery, pathname, navigate]);
	return null;
}

/** Sin footer en pantallas de trabajo a pantalla completa (quiz y retos). */
function FooterGate() {
	const { pathname } = useLocation();
	if (/^\/quiz\//.test(pathname) || /^\/editor\/[^/]+\/[^/]+/.test(pathname) || /^\/incidencias\/[^/]+/.test(pathname)) return null;
	return <Footer />;
}

function NotFound() {
	return (
		<section className="mx-auto max-w-xl px-4 py-16 text-center space-y-4">
			<p className="text-6xl">🧭</p>
			<h1 className="text-2xl font-bold">Página no encontrada</h1>
			<p className="text-muted">La ruta que buscas no existe o ha cambiado.</p>
			<Link
				to="/"
				className="inline-block px-4 py-2 rounded-lg bg-accent text-accent-fg hover:bg-accent/90"
			>
				Volver al inicio
			</Link>
		</section>
	);
}

export type Category = { id: string; slug?: string; name?: string };

export default function AppRouter() {
	return (
		<BrowserRouter>
			<PasswordRecoveryRedirect />
			<Navbar />
			<main id="contenido" tabIndex={-1} className="outline-none">
				<Suspense fallback={<p className="p-6 text-center">Cargando...</p>}>
					<Routes>
						<Route path="/" element={<Hero />} />
						<Route path="/auth/callback" element={<AuthCallback />} />
						<Route path="/quiz/:category" element={<QuizRunner />} />
						<Route
							path="/quiz/:category/:subcategory"
							element={<QuizRunner />}
						/>
						<Route path="/result" element={<Result />} />
						<Route path="/summary" element={<Summary />} />
						<Route path="/ranking" element={<Ranking />} />
						<Route
							path="/historial"
							element={
								<PrivateRoute>
									<Historial />
								</PrivateRoute>
							}
						/>
						<Route
							path="/editor"
							element={
								<PrivateRoute>
									<ChallengeCategories />
								</PrivateRoute>
							}
						/>
						<Route
							path="/editor/:categoria/:id"
							element={
								<PrivateRoute>
									<ChallengeEditorPage />
								</PrivateRoute>
							}
						/>
						<Route
							path="/incidencias"
							element={
								<PrivateRoute>
									<IncidentList />
								</PrivateRoute>
							}
						/>
						<Route
							path="/incidencias/:id"
							element={
								<PrivateRoute>
									<IncidentPage />
								</PrivateRoute>
							}
						/>
						<Route path="/restablecer" element={<ResetPassword />} />
						<Route path="/contacto" element={<ContactForm />} />
						<Route path="/gracias" element={<Gracias />} />
						<Route
							path="/dashboard"
							element={
								<PrivateRoute>
									<Dashboard />
								</PrivateRoute>
							}
						/>
						{/* Los logros reales se calculan en el dashboard */}
						<Route
							path="/logros"
							element={<Navigate to="/dashboard" replace />}
						/>
						<Route path="*" element={<NotFound />} />
					</Routes>
				</Suspense>
			</main>
			<FooterGate />
		</BrowserRouter>
	);
}
