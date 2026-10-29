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
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 px-4">
			<div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-2xl">
				<h3 className="text-xl font-bold text-fg">Ayudanos a mejorar</h3>
				<p className="mt-1 text-sm text-muted">{adaptiveQuestion}</p>

				<div className="mt-4">
					<p className="mb-2 text-sm font-medium text-muted">
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
										? "border-accent bg-accent text-accent-fg"
										: "border-line text-muted hover:bg-surface2"
								}`}
							>
								{value}
							</button>
						))}
					</div>
				</div>

				<div className="mt-4">
					<label className="mb-2 block text-sm font-medium text-muted">
						Comentario (opcional)
					</label>
					<textarea
						value={comment}
						onChange={(event) => setComment(event.target.value)}
						rows={3}
						placeholder="Cuéntanos qué mejorarías"
						className="w-full rounded-lg border border-line p-2 text-sm focus:border-accent focus:outline-none"
					/>
				</div>

				{shouldAskReason && (
					<div className="mt-4">
						<label className="mb-2 block text-sm font-medium text-muted">
							Motivo principal
						</label>
						<select
							value={reason}
							onChange={(event) =>
								setReason(event.target.value as LowRatingReason | "")
							}
							className="w-full rounded-lg border border-line p-2 text-sm focus:border-accent focus:outline-none"
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
					<p className="mt-3 rounded border border-warn/40 bg-warn-soft p-2 text-sm text-warn">
						{error}
					</p>
				)}

				<div className="mt-5 flex justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						disabled={loading}
						className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-muted hover:bg-surface2 disabled:cursor-not-allowed"
					>
						Ahora no
					</button>
					<button
						type="button"
						onClick={handleSubmit}
						disabled={loading || (shouldAskReason && !reason)}
						className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-accent/50"
					>
						{loading ? "Enviando..." : "Enviar"}
					</button>
				</div>
			</div>
		</div>
	);
}
