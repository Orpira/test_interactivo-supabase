import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import LightParticles from "@/components/ui/LightParticles";
import { useAuth } from "@/services/auth";
import {
	fetchUserExperienceLevel,
	getStoredExperienceLevel,
	setStoredExperienceLevel,
	type ExperienceLevel,
	upsertUserExperience,
} from "@/services/feedback";

export default function Hero() {
	const [showQuizCategoryPicker, setShowQuizCategoryPicker] = useState(false);
	const [showExperiencePicker, setShowExperiencePicker] = useState(false);
	const [experienceLoaded, setExperienceLoaded] = useState(false);
	const navigate = useNavigate();
	const { user } = useAuth();

	const MAIN_CATEGORIES = [
		{ key: "frontend", label: "Frontend", icon: "🎨" },
		{ key: "backend", label: "Backend", icon: "🛠️" },
		{ key: "devops", label: "DevOps", icon: "⚙️" },
		{ key: "testing", label: "Testing", icon: "🧪" },
	];

	useEffect(() => {
		if (user?.id) {
			fetchUserExperienceLevel(user.id)
				.catch(() => null)
				.finally(() => setExperienceLoaded(true));
		} else {
			setExperienceLoaded(true);
		}
	}, [user]);

	const handleStartNow = () => {
		if (!experienceLoaded) return;
		setShowExperiencePicker(true);
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
					// Capa del color de fondo del tema sobre la imagen: legible en claro y oscuro
					backgroundImage:
						"linear-gradient(rgb(var(--bg) / 0.82), rgb(var(--bg) / 0.82)), url('/fondo.png')",
					backgroundSize: "cover",
					backgroundPosition: "center",
				}}
			>
				<h2 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-2 text-fg text-center">
					Quizzes interactivos <br />
					<strong>
						<span className="text-warn">HTML, </span>
						<span className="text-accent">CSS, </span>
						<span className="text-warn">JavaScript</span>
						<span className="text-accent"> y mucho más</span>
					</strong>
				</h2>

				<div className="flex w-full max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row sm:gap-10">
					<div className="flex flex-col items-center sm:items-start">
						<p className="text-lg sm:text-xl md:text-3xl font-bold mb-2 text-fg text-center sm:text-left">
							WebWiz Quiz <br />
							<span className="text-warn text-lg sm:text-xl md:text-2xl">
								Entrena tus habilidades en frontend, backend y más con quizzes
								interactivos.
							</span>
							<span className="text-sm sm:text-base md:text-lg mb-6 text-left text-fg">
								<br />
								Evalua tus conocimientos, valida y comparte tus soluciones al
								instante.
							</span>
						</p>
						<button
							className="mt-4 px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 bg-surface2 text-fg text-sm sm:text-base md:text-lg font-bold rounded-lg shadow-lg hover:bg-line transition-colors duration-200 flex items-center"
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
				<p className="text-warn text-sm sm:text-lg md:text-xl font-semibold italic w-full sm:w-1/2 text-center">
					"Domina la magia del código, un quiz a la vez."
				</p>
				<LightParticles />
				{showExperiencePicker && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 px-4">
						<div className="w-full max-w-md rounded-xl bg-surface shadow-2xl p-6 relative">
							<button
								className="absolute top-2 right-3 text-muted hover:text-warn text-2xl font-bold"
								onClick={() => setShowExperiencePicker(false)}
								aria-label="Cerrar"
							>
								x
							</button>
							<h3 className="text-xl font-bold text-fg text-center mb-2">
								¿Cuál es tu nivel?
							</h3>
							<p className="text-sm text-muted text-center mb-4">
								Esto nos ayuda a adaptar tus evaluaciones.
							</p>
							<div className="grid gap-3">
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
											onClick={() => handleExperienceSelect(opt.value)}
											className={`w-full rounded-lg border px-4 py-3 text-left transition ${
												isActive
													? "border-accent bg-accent-soft ring-2 ring-accent"
													: "border-line hover:bg-accent-soft hover:border-accent/60"
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
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 px-4">
						<div className="w-full max-w-md rounded-xl bg-surface shadow-2xl p-6 relative">
							<button
								className="absolute top-2 right-3 text-muted hover:text-warn text-2xl font-bold"
								onClick={() => setShowQuizCategoryPicker(false)}
								aria-label="Cerrar"
							>
								x
							</button>
							<h3 className="text-xl font-bold text-fg text-center mb-2">
								Elige una categoría
							</h3>
							<p className="text-sm text-muted text-center mb-4">
								Luego eliges subcategoría y número de preguntas.
							</p>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{MAIN_CATEGORIES.map((cat) => (
									<button
										key={cat.key}
										onClick={() => handleQuizCategorySelect(cat.key)}
										className="w-full rounded-lg border border-line px-4 py-3 text-left hover:bg-accent-soft hover:border-accent/60 transition"
									>
										<span className="mr-2">{cat.icon}</span>
										<span className="font-medium text-fg">
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
