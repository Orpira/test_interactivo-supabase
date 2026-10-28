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
	onRestart?: () => void;
};

export const QuestionCard = ({
	category,
	question,
	options,
	selected,
	onSelect,
	showFeedback,
	number,
	total,
	onRestart,
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

	const answered = selected !== null;
	const progress =
		typeof number === "number" && total
			? Math.round(((number - 1) / total) * 100)
			: 0;

	return (
		<div className="relative flex flex-col items-center justify-center min-h-[500px] py-8 px-2 md:px-0 w-full max-w-[1100px] mx-auto ">
			{typeof number === "number" && total ? (
				<div className="relative z-10 mb-6 w-full max-w-3xl">
					<div className="mb-1 flex justify-between text-xs font-semibold text-blue-900">
						<span>
							Pregunta {number} de {total}
						</span>
						<span>{progress}%</span>
					</div>
					<div
						className="h-2 w-full overflow-hidden rounded-full bg-blue-100"
						role="progressbar"
						aria-valuemin={0}
						aria-valuemax={total}
						aria-valuenow={number - 1}
						aria-label="Progreso del quiz"
					>
						<div
							className="h-full rounded-full bg-blue-600 transition-all duration-300"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>
			) : null}
			{/* Contenedor pregunta + número */}
			<div className="relative z-10 mb-8 flex w-full items-center justify-center sm:mb-12">
				{/* Número de pregunta grande */}
				{typeof number === "number" && (
					<div className="flex-shrink-0 flex flex-col items-center justify-center mr-6">
						<span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-200 text-4xl font-extrabold text-blue-900 select-none z-30 shadow-lg sm:h-24 sm:w-24 sm:text-7xl">
							{number}
						</span>
					</div>
				)}
				{/* Enunciado */}
				<div className="w-full max-w-3xl rounded-2xl border-4 border-blue-200 bg-white px-4 py-4 text-center text-base font-semibold text-blue-900 shadow-2xl sm:px-8 sm:py-6 sm:text-lg sm:skew-x-[-10deg]">
					<div className="sm:skew-x-[10deg]">
						{category === "javascript" ? (
							<pre className="text-left text-base bg-transparent z-10 whitespace-pre-wrap">
								{question}
							</pre>
						) : (
							<span className="text-lg font-extrabold text-blue-900 sm:text-2xl">
								{question}
							</span>
						)}
					</div>
				</div>
			</div>
			{/* Opciones tipo romboide */}
			<div className="relative z-10 grid w-full max-w-[900px] grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 md:gap-8">
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
							type="button"
							onClick={() => onSelect(option)}
							aria-pressed={isSelected}
							className={
								`relative flex items-stretch rounded-xl shadow-xl transition duration-200 overflow-hidden group
                w-full min-h-[70px] transform sm:skew-x-[-20deg] md:hover:scale-105 ` +
								pressedClass
							}
							disabled={showFeedback || answered}
							style={{
								background: "#f5faff",
							}}
						>
							{/* Letra de opción */}
							<div
								className={`flex h-full min-w-[56px] items-center justify-center px-4 sm:min-w-[70px] sm:px-8 ${color.bg}`}
								style={{
									clipPath: "polygon(0 0, 80% 0, 80% 100%, 0% 100%)",
								}}
							>
								<span
									className={`text-2xl font-extrabold ${color.text} drop-shadow-lg sm:skew-x-[20deg] sm:rotate-45 sm:text-4xl`}
									style={{
										WebkitTextStroke: "2px #fff",
									}}
								>
									{letters[idx]}
								</span>
							</div>
							{/* Texto de la opción */}
							<span
								className={`flex flex-1 items-center px-4 text-sm font-inter font-bold text-blue-900 not-italic sm:px-6 sm:text-base md:text-lg`}
							>
								{option}
							</span>
						</button>
					);
				})}
			</div>
			{/* Botón de reinicio de quiz debajo de las preguntas SOLO si no está autenticado */}
			{onRestart && (
				<div className="w-full flex justify-end mt-6">
					<button
						type="button"
						onClick={onRestart}
						title="Reiniciar quiz"
						aria-label="Reiniciar quiz"
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
