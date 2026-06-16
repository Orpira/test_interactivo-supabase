import { useMemo, useState } from "react";
import type { ExperienceLevel } from "@/services/feedback";

type LowRatingReason =
	| "dificultad"
	| "claridad"
	| "errores_tecnicos"
	| "desactualizado";

type ExperienceFeedbackModalProps = {
	open: boolean;
	experienceLevel: ExperienceLevel;
	loading?: boolean;
	error?: string | null;
	onClose: () => void;
	onSubmit: (payload: {
		rating: number;
		comment: string;
		reason?: LowRatingReason;
	}) => Promise<void>;
};

const LOW_RATING_REASONS: { value: LowRatingReason; label: string }[] = [
	{ value: "dificultad", label: "Dificultad" },
	{ value: "claridad", label: "Claridad" },
	{ value: "errores_tecnicos", label: "Errores técnicos" },
	{ value: "desactualizado", label: "Contenido desactualizado" },
];

function getAdaptiveQuestion(level: ExperienceLevel) {
	switch (level) {
		case "junior":
			return "¿Las explicaciones fueron claras para ti?";
		case "semi_senior":
			return "¿La dificultad del quiz estuvo bien calibrada?";
		case "senior":
			return "¿El contenido fue retador y relevante?";
		default:
			return "¿Qué te pareció el quiz?";
	}
}

export default function ExperienceFeedbackModal({
	open,
	experienceLevel,
	loading = false,
	error,
	onClose,
	onSubmit,
}: ExperienceFeedbackModalProps) {
	const [rating, setRating] = useState(5);
	const [comment, setComment] = useState("");
	const [reason, setReason] = useState<LowRatingReason | "">("");

	const adaptiveQuestion = useMemo(
		() => getAdaptiveQuestion(experienceLevel),
		[experienceLevel],
	);

	if (!open) {
		return null;
	}

	const shouldAskReason = rating <= 2;

	const handleSubmit = async () => {
		if (shouldAskReason && !reason) {
			return;
		}

		await onSubmit({
			rating,
			comment,
			reason: shouldAskReason ? (reason as LowRatingReason) : undefined,
		});
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
			<div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
				<h3 className="text-xl font-bold text-slate-900">Ayudanos a mejorar</h3>
				<p className="mt-1 text-sm text-slate-600">{adaptiveQuestion}</p>

				<div className="mt-4">
					<p className="mb-2 text-sm font-medium text-slate-700">
						¿Qué tan útil fue este quiz?
					</p>
					<div className="flex gap-2">
						{[1, 2, 3, 4, 5].map((value) => (
							<button
								key={value}
								type="button"
								onClick={() => setRating(value)}
								className={`h-10 w-10 rounded-lg border font-semibold transition ${
									rating === value
										? "border-indigo-600 bg-indigo-600 text-white"
										: "border-slate-200 text-slate-700 hover:bg-slate-50"
								}`}
							>
								{value}
							</button>
						))}
					</div>
				</div>

				<div className="mt-4">
					<label className="mb-2 block text-sm font-medium text-slate-700">
						Comentario (opcional)
					</label>
					<textarea
						value={comment}
						onChange={(event) => setComment(event.target.value)}
						rows={3}
						placeholder="Cuéntanos qué mejorarías"
						className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:outline-none"
					/>
				</div>

				{shouldAskReason && (
					<div className="mt-4">
						<label className="mb-2 block text-sm font-medium text-slate-700">
							Motivo principal
						</label>
						<select
							value={reason}
							onChange={(event) =>
								setReason(event.target.value as LowRatingReason | "")
							}
							className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:outline-none"
						>
							<option value="">Selecciona una opción</option>
							{LOW_RATING_REASONS.map((item) => (
								<option key={item.value} value={item.value}>
									{item.label}
								</option>
							))}
						</select>
					</div>
				)}

				{error && (
					<p className="mt-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
						{error}
					</p>
				)}

				<div className="mt-5 flex justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						disabled={loading}
						className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed"
					>
						Ahora no
					</button>
					<button
						type="button"
						onClick={handleSubmit}
						disabled={loading || (shouldAskReason && !reason)}
						className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
					>
						{loading ? "Enviando..." : "Enviar"}
					</button>
				</div>
			</div>
		</div>
	);
}
