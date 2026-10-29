import { useRef } from "react";
import { CONFIDENCE_LABEL, type Confidence } from "./fsrs";

const ORDER: Confidence[] = ["adivino", "creo", "seguro"];

/** Control segmentado "Adivino / Creo que sí / Seguro" (radiogroup con flechas). */
export default function ConfidencePicker({ value, onChange }: { value: Confidence; onChange: (c: Confidence) => void }) {
	const refs = useRef<(HTMLButtonElement | null)[]>([]);
	const move = (delta: number) => {
		const i = (ORDER.indexOf(value) + delta + ORDER.length) % ORDER.length;
		onChange(ORDER[i]);
		refs.current[i]?.focus();
	};
	return (
		<div>
			<p id="confianza-label" className="mb-2 text-sm font-medium text-muted">
				¿Cuánta confianza tienes?
			</p>
			<div
				role="radiogroup"
				aria-labelledby="confianza-label"
				className="grid grid-cols-3 gap-1 rounded-lg border border-line bg-surface p-1"
				onKeyDown={(e) => {
					if (e.key === "ArrowRight" || e.key === "ArrowDown") {
						e.preventDefault();
						move(1);
					} else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
						e.preventDefault();
						move(-1);
					}
				}}
			>
				{ORDER.map((c, i) => (
					<button
						key={c}
						ref={(el) => {
							refs.current[i] = el;
						}}
						type="button"
						role="radio"
						aria-checked={value === c}
						tabIndex={value === c ? 0 : -1}
						onClick={() => onChange(c)}
						className={`min-h-touch rounded-md px-2 text-sm font-semibold transition-colors ${
							value === c ? "bg-accent text-accent-fg" : "text-muted hover:bg-surface2 hover:text-fg"
						}`}
					>
						{CONFIDENCE_LABEL[c]}
					</button>
				))}
			</div>
		</div>
	);
}
