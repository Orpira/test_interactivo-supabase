import { Link } from "react-router-dom";
import { useAuth } from "../../services/auth";
import { useState } from "react";

export default function Navbar() {
	const { isAuthenticated, loginWithGoogle, user, logout } = useAuth();
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleEmailLogin(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			const { error } = await import("../../services/supabase").then(
				({ supabase }) => supabase.auth.signInWithPassword({ email, password }),
			);
			if (error) setError(error.message);
			else setShowLoginModal(false);
		} catch (err: any) {
			setError(err.message || "Error desconocido");
		} finally {
			setLoading(false);
		}
	}

	return (
		<>
			<nav className="sticky top-0 z-50 bg-slate-900 text-white px-4 py-3 flex items-center gap-8 shadow-md backdrop-blur-md">
				<Link to="/" className="flex items-center gap-2 font-bold text-xl">
					<img src="/logo.png" alt="Logo" className="w-10 h-10" />
					WebWiz Quiz
				</Link>
				<Link to="/" className="hover:text-indigo-300">
					Inicio
				</Link>
				<Link to="/quiz" className="hover:text-indigo-300">
					Quizzes
				</Link>
				<Link to="/editor/html/html-01" className="hover:text-indigo-300">
					Retos
				</Link>
				{isAuthenticated && (
					<Link to="/dashboard" className="hover:text-indigo-300">
						Dashboard
					</Link>
				)}
				<Link to="/contacto" className="hover:text-indigo-300">
					Contacto
				</Link>
				<div className="ml-auto flex items-center gap-4">
					{isAuthenticated ? (
						<>
							<span className="font-semibold text-indigo-200">
								{user?.name || user?.email}
							</span>
							<button
								onClick={logout}
								className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded transition"
							>
								Cerrar sesión
							</button>
						</>
					) : (
						<button
							onClick={() => setShowLoginModal(true)}
							className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded transition"
						>
							Iniciar sesión
						</button>
					)}
				</div>
			</nav>
			{showLoginModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
					<div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-xs relative">
						<button
							className="absolute top-2 right-3 text-gray-500 hover:text-red-500 text-2xl font-bold"
							onClick={() => setShowLoginModal(false)}
							aria-label="Cerrar"
						>
							×
						</button>
						<h2 className="text-xl font-bold mb-4 text-center text-slate-900">
							Iniciar sesión
						</h2>
						<button
							onClick={async () => {
								setLoading(true);
								setError("");
								try {
									await loginWithGoogle();
								} catch (e: any) {
									setError(e.message);
								} finally {
									setLoading(false);
								}
							}}
							className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded mb-4 flex items-center justify-center gap-2"
							disabled={loading}
						>
							<svg className="w-5 h-5" viewBox="0 0 48 48">
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
							Continuar con Google
						</button>
						<form onSubmit={handleEmailLogin} className="space-y-3">
							<input
								type="email"
								className="w-full border px-3 py-2 rounded"
								placeholder="Correo electrónico"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								autoFocus
							/>
							<input
								type="password"
								className="w-full border px-3 py-2 rounded"
								placeholder="Contraseña"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
							{error && (
								<div className="text-red-600 text-sm text-center">{error}</div>
							)}
							<button
								type="submit"
								className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded mt-2"
								disabled={loading}
							>
								{loading ? "Ingresando..." : "Ingresar"}
							</button>
						</form>
					</div>
				</div>
			)}
		</>
	);
}
