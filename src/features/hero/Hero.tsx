import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../../services/auth";
import { useState } from "react";
import AuthModal from "@/components/ui/AuthModal";
import ChallengeCategories from "../challenges/pages/ChallengeCategories";
import LightParticles from "@/components/ui/LightParticles";

export default function Hero() {
	const { isAuthenticated, loginWithRedirect } = useAuth();
	const [showAuthAlert, setShowAuthAlert] = useState(false);
	// Para manejar el modal de autenticación
	const [showAuth, setShowAuth] = useState(false);
	const navigate = useNavigate();

	type Lang = "HTML" | "CSS" | "JavaScript";

	const handleCardClick = (category: Lang) => {
		if (!isAuthenticated) {
			setShowAuthAlert(true);
			return;
		}
		goToFirstChallenge(category);
	};

	const goToFirstChallenge = (category: Lang) => {
		// … lógica que ya tenías para localizar el reto …
		navigate(`/editor/${category.toLowerCase()}/${category.toLowerCase()}-01`);
	};

	return (
		<>
			<section
				className="w-full min-h-screen flex flex-col items-center justify-start px-4 pt-10 relative"
				style={{
					backgroundImage: "url('/fondo.png')",
					backgroundSize: "cover",
					backgroundPosition: "center",
				}}
			>
				<h2 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-2 text-white text-center">
					Quizzes y retos interactivos <br />
					<strong>
						<span style={{ color: "orange" }}>HTML, </span>
						<span style={{ color: "cyan" }}>CSS,</span>
						<span style={{ color: "yellow" }}>JavaScript.</span>
					</strong>
				</h2>

				<div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-6xl">
					<p className="text-lg sm:text-xl md:text-3xl font-bold mb-2 text-white text-center sm:text-left">
						WebWiz Quiz <br />
						<span className="text-orange-400 text-lg sm:text-xl md:text-2xl">
							¡Aprende y diviértete!
						</span>
						<span className="text-sm sm:text-base md:text-lg mb-6 text-left text-white">
							<br />
							Evalua tus conocimientos, valida y comparte tus soluciones al
							instante.
						</span>
					</p>

					<motion.img
						src="/logo.png"
						alt="WebWiz Quiz Logo"
						className="w-32 sm:w-40 md:w-64 lg:w-80 h-auto"
						initial={{ opacity: 0, scale: 0.7 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.6, ease: "easeOut" }}
						whileHover={{ scale: 1.08 }}
					/>
				</div>
				<p className="text-orange-400 text-sm sm:text-lg md:text-xl font-semibold italic w-full sm:w-1/2 text-center">
					"Domina la magia del código, un quiz a la vez."
				</p>
				<LightParticles />
				<button
					className="mt-6 px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 bg-gray-800 text-white text-sm sm:text-base md:text-lg font-bold rounded-lg shadow-lg hover:bg-gray-700 transition-colors duration-200 flex items-center"
					onClick={() => {
						navigate("/quiz");
					}}
				>
					¡Empieza ahora!
					<motion.div
						animate={{
							x: [0, 3, 0],
						}}
						transition={{
							duration: 1.5,
							repeat: Infinity,
							repeatType: "loop",
							ease: "easeInOut",
						}}
						className="inline-block"
					>
						<ArrowRight className="ml-2" />
					</motion.div>
				</button>
				<motion.img
					src="/languajes.png"
					alt="Lenguajes de Programación"
					className="hidden sm:block w-40 sm:w-64 md:w-80 lg:w-96 xl:w-[500px] h-auto object-contain mt-2"
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.2 }}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					loading="lazy"
					decoding="async"
					fetchPriority="low"
				/>
				<div className="mt-12 mb-16 flex flex-col md:flex-row gap-6 w-full max-w-2xl justify-center items-center">
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
					<ChallengeCategories
						isAuthenticated={isAuthenticated}
						onSelectCategory={handleCardClick}
					/>
				</div>
			</section>
		</>
	);
}
