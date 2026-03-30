import { useAuth } from "../../services/auth";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserButton from "./UserButton";
import { ArrowRight } from "lucide-react";
import AuthModal from "./AuthModal";

/* ——— helpers ——— */
const desktopLink =
	"relative after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-indigo-500 after:transition-all text-xl hover:after:w-full";
const desktopDashboard =
	"relative after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-indigo-500 after:transition-all text-xl hover:after:w-full font-semibold text-indigo-600 dark:text-indigo-400";
const mobileLink = "text-slate-100 hover:text-indigo-300 transition";
const mobileDashboard = "text-slate-100 hover:text-indigo-300 transition";

export default function Navbar() {
	const { isAuthenticated, loginWithRedirect } = useAuth();
	const [open, setOpen] = useState(false);
	const [showAuthAlert, setShowAuthAlert] = useState(false);
	const navigate = useNavigate();

	const close = () => setOpen(false);

	type Lang = "HTML" | "CSS" | "JavaScript";

	const handleCardClick = (category: Lang) => {
		if (!isAuthenticated) {
			setShowAuthAlert(true);
			return;
		}
		navigate(`/editor/${category.toLowerCase()}/${category.toLowerCase()}-01`);
	};

	return (
		/* ---------- NAV ---------- */
		<nav
			className="
        sticky top-0 z-50 w-full
        bg-gradient-to-r from-white/70 via-white/60 to-white/30
        dark:from-slate-900/90 dark:via-slate-900/80 dark:to-slate-900/60
        backdrop-blur-md ring-1 ring-slate-900/5 dark:ring-slate-50/10
        shadow-md transition-colors
        font-sans
      "
		>
			<div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
				{/* ---------- LOGO ---------- */}
				<Link
					to="/"
					className="flex items-center gap-2 font-extrabold text-xl sm:text-3xl text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition"
					onClick={close}
				>
					<img src="/logo.png" alt="Logo" className="w-24 h-24" />
					WebWiz&nbsp;Quiz
				</Link>

				{/* ---------- LINKS DESKTOP ---------- */}
				<ul className="hidden md:flex gap-8 text-base font-semibold text-slate-700 dark:text-slate-200">
					<li>
						<Link to="/" className={desktopLink}>
							Inicio
						</Link>
					</li>
					<li>
						<Link to="/quiz" className={desktopLink}>
							Quizzes
						</Link>
					</li>
					<li>
						{showAuthAlert && (
							<AuthModal
								open={showAuthAlert}
								onLogin={() => {
									setShowAuthAlert(false);
									loginWithRedirect();
								}}
								onClose={() => setShowAuthAlert(false)}
							/>
						)}
						<button
							onClick={() => handleCardClick("HTML")}
							className={desktopLink}
						>
							Retos
						</button>
					</li>

					{isAuthenticated && (
						<>
							<li>
								<Link to="/dashboard" className={desktopDashboard}>
									Dashboard
								</Link>
							</li>
						</>
					)}
					<li>
						<Link to="/contacto" className={desktopLink}>
							Contacto
						</Link>
					</li>
				</ul>

				{/* ---------- CTA DESKTOP ---------- */}
				{!isAuthenticated && (
					<button
						onClick={() => loginWithRedirect()}
						className="hidden md:inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 transition text-lg"
					>
						Iniciar&nbsp;sesión
						<ArrowRight className="w-5 h-5" />
					</button>
				)}

				{isAuthenticated && (
					<div className="hidden md:inline-flex">
						<UserButton />
					</div>
				)}

				{/* ---------- HAMBURGER ---------- */}
				<button
					aria-label={open ? "Cerrar menú" : "Abrir menú"}
					onClick={() => setOpen(!open)}
					className="md:hidden p-3 text-slate-700 dark:text-slate-200"
				>
					{open ? (
						<svg
							className="w-8 h-8"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					) : (
						<svg
							className="w-8 h-8"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 8h16M4 16h16"
							/>
						</svg>
					)}
				</button>
			</div>

			{/* ---------- PANEL MOBILE ---------- */}
			{open && (
				<nav
					aria-label="Menú móvil"
					data-testid="mobile-nav"
					className="md:hidden absolute top-full left-0 w-full z-40 bg-slate-800/95 dark:bg-slate-950 backdrop-blur-md shadow-xl"
				>
					<button
						aria-label="Cerrar menú"
						onClick={() => setOpen(false)}
						className="p-3 text-white hover:text-gray-300"
					>
						Cerrar
					</button>
					<div className="flex flex-col items-center gap-6 py-8">
						<Link to="/" onClick={close} className={mobileLink}>
							Inicio
						</Link>
						<Link to="/quiz" onClick={close} className={mobileLink}>
							Quizzes
						</Link>
						<li>
							{showAuthAlert && (
								<AuthModal
									open={showAuthAlert}
									onLogin={() => {
										setShowAuthAlert(false);
										loginWithRedirect();
									}}
									onClose={() => setShowAuthAlert(false)}
								/>
							)}
							<button
								onClick={() => {
									handleCardClick("HTML");
									close();
								}}
								className={mobileDashboard}
							>
								Retos
							</button>
						</li>

						{isAuthenticated && (
							<Link to="/dashboard" onClick={close} className={mobileDashboard}>
								Dashboard
							</Link>
						)}
						<Link to="/contacto" onClick={close} className={mobileLink}>
							Contacto
						</Link>

						{/* CTA / User */}
						{isAuthenticated ? (
							<div className="mt-auto">
								<UserButton />
							</div>
						) : (
							<button
								onClick={() => {
									loginWithRedirect();
									close();
								}}
								className="mt-auto px-6 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition text-lg"
							>
								Iniciar sesión
							</button>
						)}
					</div>
				</nav>
			)}
		</nav>
	);
}
