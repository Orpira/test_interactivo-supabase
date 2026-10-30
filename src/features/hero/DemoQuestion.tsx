import { useState } from "react";
import { Check, Loader2, Play, Sparkles, X } from "lucide-react";
import CodeBlock from "@/components/quiz/CodeBlock";
import { PREDICT_QUESTIONS } from "@/content/questions/predict";
import { OPTION_LETTERS } from "@/components/quiz/richText";

type Confidence = "adivino" | "creo" | "seguro";
const CONFIDENCE: { id: Confidence; label: string }[] = [
	{ id: "adivino", label: "Adivino" },
	{ id: "creo", label: "Creo que sí" },
	{ id: "seguro", label: "Seguro" },
];

// Pregunta de muestra: el orden del event loop (sorprende a casi todos)
const Q = PREDICT_QUESTIONS.find((q) => q.concepts.includes("event-loop") && q.code.includes("Promise.resolve")) ?? PREDICT_QUESTIONS[0];

/**
 * Pregunta real jugable en la portada, sin cuenta: elegir, declarar confianza,
 * comprobar y ejecutar el código. Al final, invitación a seguir con cuenta.
 */
export default function DemoQuestion({ onSignup }: { onSignup: () => void }) {
	const [selected, setSelected] = useState<string | null>(null);
	const [confidence, setConfidence] = useState<Confidence>("creo");
	const [checked, setChecked] = useState(false);
	const [run, setRun] = useState<{ running: boolean; lines?: string[] } | null>(null);
	const correct = selected === Q.correctAnswer;

	const verdict = !checked
		? null
		: correct
			? confidence === "adivino"
				? "Acierto, pero adivinando"
				: "¡Correcto!"
			: confidence === "seguro"
				? "Fallo con confianza alta"
				: "No es correcta";

	const execute = async () => {
		setRun({ running: true });
		const { runSnippet } = await import("@/features/challenges/engine/runner");
		const res = await runSnippet(Q.code);
		setRun({ running: false, lines: res.lines.filter(Boolean) });
	};

	return (
		<div className="rounded-2xl border border-line bg-surface p-4 shadow-[0_30px_80px_-40px_rgb(var(--accent)/0.6)] sm:p-5">
			<div className="flex items-center justify-between gap-2">
				<p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">Pruébalo ahora · sin cuenta</p>
				<span className="rounded-full border border-line px-2 py-0.5 font-mono text-[0.7rem] text-muted">Event loop</span>
			</div>
			<p id="demo-pregunta" className="mt-2 font-display text-lg font-bold">
				{Q.question}
			</p>
			<CodeBlock code={Q.code} lang="javascript" className="mt-3 text-sm" />

			<div role="radiogroup" aria-labelledby="demo-pregunta" className="mt-3 grid gap-2 sm:grid-cols-2">
				{Q.options.map((o, i) => {
					const state = !checked ? (selected === o ? "sel" : "") : o === Q.correctAnswer ? "ok" : selected === o ? "bad" : "dim";
					return (
						<button
							key={o}
							type="button"
							role="radio"
							aria-checked={selected === o}
							disabled={checked}
							onClick={() => setSelected(o)}
							className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 text-left font-mono text-sm transition-colors ${
								state === "sel"
									? "border-accent bg-accent-soft"
									: state === "ok"
										? "border-accent bg-accent-softer"
										: state === "bad"
											? "border-warn bg-warn-soft"
											: state === "dim"
												? "border-line opacity-60"
												: "border-line hover:border-accent/60"
							}`}
						>
							<span
								className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold ${
									state === "sel" || state === "ok" ? "bg-accent text-accent-fg" : state === "bad" ? "bg-warn text-warn-fg" : "bg-surface2"
								}`}
								aria-hidden="true"
							>
								{OPTION_LETTERS[i]}
							</span>
							{o}
						</button>
					);
				})}
			</div>

			{!checked ? (
				<>
					<p id="demo-confianza" className="mt-4 text-sm font-medium text-muted">
						¿Cuánta confianza tienes?
					</p>
					<div role="radiogroup" aria-labelledby="demo-confianza" className="mt-1.5 grid grid-cols-3 gap-1 rounded-lg border border-line bg-bg/40 p-1">
						{CONFIDENCE.map((c) => (
							<button
								key={c.id}
								type="button"
								role="radio"
								aria-checked={confidence === c.id}
								onClick={() => setConfidence(c.id)}
								className={`min-h-10 rounded-md text-sm font-semibold ${confidence === c.id ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"}`}
							>
								{c.label}
							</button>
						))}
					</div>
					<button
						type="button"
						disabled={!selected}
						onClick={() => setChecked(true)}
						className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-accent font-semibold text-accent-fg hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-surface2 disabled:text-muted"
					>
						Comprobar
					</button>
				</>
			) : (
				<div aria-live="polite" className={`mt-4 rounded-xl border p-3 ${correct ? "border-accent/50 bg-accent-softer" : "border-warn/50 bg-warn-soft"}`}>
					<p className={`flex items-center gap-1.5 font-display font-bold ${correct ? "text-accent" : "text-warn"}`}>
						{correct ? <Check className="h-5 w-5" aria-hidden="true" /> : <X className="h-5 w-5" aria-hidden="true" />}
						{verdict}
					</p>
					{!correct && selected && Q.optionMeta[selected] && (
						<p className="mt-1 text-sm">
							<strong>Por qué era tentadora:</strong> {Q.optionMeta[selected].whyTempting}
						</p>
					)}
					<p className="mt-1 text-sm">{Q.shortExplanation}</p>
					<div className="mt-3 flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={() => void execute()}
							disabled={run?.running}
							className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-line bg-surface px-3 text-sm font-semibold hover:border-accent/60"
						>
							{run?.running ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
							Ejecutar el código
						</button>
						{run?.lines && <span className="font-mono text-sm">› {run.lines.join(", ")}</span>}
					</div>
					<button
						type="button"
						onClick={onSignup}
						className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-fg px-4 text-sm font-semibold text-bg hover:opacity-90"
					>
						<Sparkles className="h-4 w-4" aria-hidden="true" /> Guarda tu progreso: crea tu cuenta gratis
					</button>
				</div>
			)}
		</div>
	);
}
