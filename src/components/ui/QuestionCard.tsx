import React from "react";
import { useAuth } from "../../services/auth";

type QuestionProps = {
	category: string;
	question: string;
	options: string[];
	selected: string | null;
	onSelect: (option: string) => void;
	correctAnswer: string;
	showFeedback: boolean;
	number?: number;
	total?: number;
	onPrev?: () => void;
};

export const QuestionCard = ({
	category,
	question,
	options,
	selected,
	onSelect,
	correctAnswer,
	showFeedback,
	number,
	total,
	onPrev,
}: QuestionProps) => {
	// Letras para las opciones
	const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];

	// Colores para letras y bordes (A, B, C, D)
	const letterColors = [
		{
			bg: "bg-blue-700",
			text: "text-white",
		},
		{
			bg: "bg-cyan-500",
			text: "text-white",
		},
		{
			bg: "bg-red-500",
			text: "text-white",
		},
		{
			bg: "bg-yellow-500",
			text: "text-white",
		},
	];

	const { isAuthenticated } = useAuth();

	return (
		<div className="relative flex flex-col items-center justify-center min-h-[500px] py-8 px-2 md:px-0 w-full max-w-[1100px] mx-auto ">
			{/* Contenedor pregunta + número */}
			<div className="flex items-center justify-center w-full mb-12 relative z-10">
				{/* Número de pregunta grande */}
				{typeof number === "number" && (
					<div className="flex-shrink-0 flex flex-col items-center justify-center mr-6">
						<span className="w-24 h-24 flex items-center justify-center text-7xl font-extrabold rounded-full bg-blue-200 text-blue-900 select-none z-30 shadow-lg">
							{number}
						</span>
					</div>
				)}
				{/* Enunciado */}
				<div className="shadow-2xl rounded-2xl bg-white border-4 border-blue-200 px-8 py-6 max-w-3xl w-full text-center text-blue-900 text-lg font-semibold skew-x-[-10deg]">
					<div className="skew-x-[10deg]">
						{category === "javascript" ? (
							<pre className="text-left text-base bg-transparent z-10 whitespace-pre-wrap">
								{question}
							</pre>
						) : (
							<span className="text-2xl font-extrabold text-blue-900">
								{question}
							</span>
						)}
					</div>
				</div>
			</div>
			{/* Opciones tipo romboide */}
			<div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-[900px]">
				{options.map((option, idx) => {
					const isSelected = option === selected;
					const color = letterColors[idx % 4];
					// Efecto presionado si está seleccionada
					const pressedClass =
						isSelected && !showFeedback
							? "translate-y-1 scale-95 shadow-inner ring-4 ring-white"
							: "";

					return (
						<button
							key={idx}
							onClick={() => onSelect(option)}
							className={
								`relative flex items-stretch rounded-xl shadow-xl transition duration-200 overflow-hidden group
                w-full min-h-[70px] transform skew-x-[-20deg] hover:scale-105 ` +
								pressedClass
							}
							disabled={showFeedback}
							style={{
								background: "#f5faff",
							}}
						>
							{/* Letra de opción */}
							<div
								className={`flex items-center justify-center px-8 min-w-[70px] h-full ${color.bg}`}
								style={{
									clipPath: "polygon(0 0, 80% 0, 80% 100%, 0% 100%)",
								}}
							>
								<span
									className={`text-4xl font-extrabold ${color.text} drop-shadow-lg skew-x-[20deg] rotate-45`}
									style={{
										WebkitTextStroke: "2px #fff",
									}}
								>
									{letters[idx]}
								</span>
							</div>
							{/* Texto de la opción */}
							<span
								className={`flex-1 flex items-center px-6 text-sm md:text-lg font-inter font-bold text-blue-900 not-italic`}
							>
								{option}
							</span>
						</button>
					);
				})}
			</div>
			{/* Botón de reinicio de quiz debajo de las preguntas SOLO si no está autenticado */}
			{!isAuthenticated && (
				<div className="w-full flex justify-end mt-6">
					<button
						onClick={() => {
							if (typeof window !== "undefined") {
								window.location.reload();
							}
							if (onPrev) onPrev();
						}}
						title="Reiniciar"
						className="bg-blue-100 hover:bg-blue-200 rounded-full p-2 shadow transition flex items-center justify-center"
						style={{ width: 40, height: 40 }}
					>
						{/* Icono de reinicio (SVG mejorado) */}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="w-6 h-6 text-red-700"
						>
							<path d="M21 2v6h-6" />
							<path d="M3 12a9 9 0 0 1 15-6.7l3 2.7" />
							<path d="M21 12a9 9 0 1 1-9-9" />
						</svg>
					</button>
				</div>
			)}
		</div>
	);
};

export default QuestionCard;
