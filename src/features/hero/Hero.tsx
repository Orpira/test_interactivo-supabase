import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import LightParticles from "@/components/ui/LightParticles";
import { useAuth } from "@/services/auth";
import {
	getStoredExperienceLevel,
	setStoredExperienceLevel,
	type ExperienceLevel,
	upsertUserExperience,
} from "@/services/feedback";

export default function Hero() {
	const [showQuizCategoryPicker, setShowQuizCategoryPicker] = useState(false);
	const [showExperiencePicker, setShowExperiencePicker] = useState(false);
	const navigate = useNavigate();
	const { user } = useAuth();

	const MAIN_CATEGORIES = [
		{ key: "frontend", label: "Frontend", icon: "🎨" },
		{ key: "backend", label: "Backend", icon: "🛠️" },
		{ key: "devops", label: "DevOps", icon: "⚙️" },
		{ key: "testing", label: "Testing", icon: "🧪" },
	];

	const handleStartNow = () => {
		if (!getStoredExperienceLevel()) {
			setShowExperiencePicker(true);
			return;
		}
		setShowQuizCategoryPicker(true);
	};

	const handleExperienceSelect = async (level: ExperienceLevel) => {
		setStoredExperienceLevel(level);
		setShowExperiencePicker(false);

		if (user?.id) {
			try {
				await upsertUserExperience(user.id, level);
			} catch (error) {
				console.error("No se pudo guardar la experiencia del usuario:", error);
			}
		}

		setShowQuizCategoryPicker(true);
	};

	const handleQuizCategorySelect = (categoryKey: string) => {
		setShowQuizCategoryPicker(false);
		navigate(`/?quizCategory=${encodeURIComponent(categoryKey)}`);
	};

	return (
		<>
			<section
				className="relative flex min-h-[calc(100vh-8.5rem)] w-full flex-col items-center justify-start overflow-hidden px-4 pt-8 sm:pt-10"
				style={{
					backgroundImage: "url('/fondo.png')",
					backgroundSize: "cover",
					backgroundPosition: "center",
				}}
			>
				<h2 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-2 text-white text-center">
					Quizzes interactivos <br />
					<strong>
						<span style={{ color: "orange" }}>HTML, </span>
						<span style={{ color: "cyan" }}>CSS,</span>
						<span style={{ color: "yellow" }}>JavaScript</span>
						<span style={{ color: "orange" }}> y mucho más!!...</span>
					</strong>
				</h2>

				<div className="flex w-full max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row sm:gap-10">
					<div className="flex flex-col items-center sm:items-start">
						<p className="text-lg sm:text-xl md:text-3xl font-bold mb-2 text-white text-center sm:text-left">
							WebWiz Quiz <br />
							<span className="text-orange-400 text-lg sm:text-xl md:text-2xl">
								Entrena tus habilidades en frontend, backend y más con quizzes
								interactivos.
							</span>
							<span className="text-sm sm:text-base md:text-lg mb-6 text-left text-white">
								<br />
								Evalua tus conocimientos, valida y comparte tus soluciones al
								instante.
							</span>
						</p>
						<button
							className="mt-4 px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 bg-gray-800 text-white text-sm sm:text-base md:text-lg font-bold rounded-lg shadow-lg hover:bg-gray-700 transition-colors duration-200 flex items-center"
							onClick={handleStartNow}
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
					</div>

					<motion.img
						src="/logo.png"
						alt="WebWiz Quiz Logo"
						className="h-auto w-28 sm:w-40 md:w-64 lg:w-80"
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
				{showExperiencePicker && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
						<div className="w-full max-w-md rounded-xl bg-white shadow-2xl p-6 relative">
							<button
								className="absolute top-2 right-3 text-gray-500 hover:text-red-500 text-2xl font-bold"
								onClick={() => setShowExperiencePicker(false)}
								aria-label="Cerrar"
							>
								x
							</button>
							<h3 className="text-xl font-bold text-slate-900 text-center mb-2">
								¿Cuál es tu nivel?
							</h3>
							<p className="text-sm text-slate-600 text-center mb-4">
								Esto nos ayuda a adaptar tus evaluaciones.
							</p>
							<div className="grid gap-3">
								<button
									onClick={() => handleExperienceSelect("junior")}
									className="w-full rounded-lg border border-slate-200 px-4 py-3 text-left hover:bg-indigo-50 hover:border-indigo-300 transition"
								>
									Junior
								</button>
								<button
									onClick={() => handleExperienceSelect("semi_senior")}
									className="w-full rounded-lg border border-slate-200 px-4 py-3 text-left hover:bg-indigo-50 hover:border-indigo-300 transition"
								>
									Semi Senior
								</button>
								<button
									onClick={() => handleExperienceSelect("senior")}
									className="w-full rounded-lg border border-slate-200 px-4 py-3 text-left hover:bg-indigo-50 hover:border-indigo-300 transition"
								>
									Senior
								</button>
							</div>
						</div>
					</div>
				)}
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
				{showQuizCategoryPicker && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
						<div className="w-full max-w-md rounded-xl bg-white shadow-2xl p-6 relative">
							<button
								className="absolute top-2 right-3 text-gray-500 hover:text-red-500 text-2xl font-bold"
								onClick={() => setShowQuizCategoryPicker(false)}
								aria-label="Cerrar"
							>
								x
							</button>
							<h3 className="text-xl font-bold text-slate-900 text-center mb-2">
								Elige una categoría
							</h3>
							<p className="text-sm text-slate-600 text-center mb-4">
								Luego eliges subcategoría y número de preguntas.
							</p>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{MAIN_CATEGORIES.map((cat) => (
									<button
										key={cat.key}
										onClick={() => handleQuizCategorySelect(cat.key)}
										className="w-full rounded-lg border border-slate-200 px-4 py-3 text-left hover:bg-indigo-50 hover:border-indigo-300 transition"
									>
										<span className="mr-2">{cat.icon}</span>
										<span className="font-medium text-slate-800">
											{cat.label}
										</span>
									</button>
								))}
							</div>
						</div>
					</div>
				)}
			</section>
		</>
	);
}
