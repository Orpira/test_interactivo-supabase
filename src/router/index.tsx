import { lazy, Suspense } from "react";
import { BrowserRouter, Link, Navigate, Routes, Route } from "react-router-dom";
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
const ChallengeEditorPage = lazy(
	() => import("@/features/challenges/pages/ChallengeEditorPage")
);

function NotFound() {
	return (
		<section className="mx-auto max-w-xl px-4 py-16 text-center space-y-4">
			<p className="text-6xl">🧭</p>
			<h1 className="text-2xl font-bold">Página no encontrada</h1>
			<p className="text-gray-600">
				La ruta que buscas no existe o ha cambiado.
			</p>
			<Link
				to="/"
				className="inline-block px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
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
			<Navbar />
			<Suspense fallback={<p className="p-6 text-center">Cargando...</p>}>
				<Routes>
					<Route path="/" element={<Hero />} />
					<Route path="/auth/callback" element={<Navigate to="/" replace />} />
					<Route path="/quiz/:category" element={<QuizRunner />} />
					<Route path="/quiz/:category/:subcategory" element={<QuizRunner />} />
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
			<Footer />
		</BrowserRouter>
	);
}
