import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Check, Loader2, Repeat, Sparkles, X } from "lucide-react";
import { EXPLAIN_PROMPTS } from "@/content/explain";
import CodeBlock from "@/components/quiz/CodeBlock";
import { useAuth } from "@/services/auth";
import { pushAnswer } from "@/services/learningSync";
import { requestExplainReview, type ExplainReview } from "@/services/explain";
import { conceptsForQuestion } from "@/features/learning/concepts";
import { useLearning } from "@/features/learning/store";
import { MIN_ANSWER_CHARS, MAX_ANSWER_CHARS } from "../../../supabase/functions/explain-review/review";

export default function ExplainPage() {
	const { id } = useParams();
	const prompt = EXPLAIN_PROMPTS.find((p) => p.id === id);
	if (!prompt)
		return (
			<div className="space-y-3 p-6 text-center">
				<p>Pregunta no encontrada.</p>
				<Link to="/explica" className="text-accent underline">
					Ver todas
				</Link>
			</div>
		);
	return <Explain key={prompt.id} prompt={prompt} />;
}

function Explain({ prompt }: { prompt: (typeof EXPLAIN_PROMPTS)[number] }) {
	const { user } = useAuth();
	const [answer, setAnswer] = useState("");
	const [state, setState] = useState<{ loading: boolean; review?: ExplainReview; error?: string; returns?: string }>({ loading: false });
	const [concept] = conceptsForQuestion({ concepts: [prompt.concept] });
	const index = EXPLAIN_PROMPTS.indexOf(prompt);
	const next = EXPLAIN_PROMPTS[index + 1];
	const tooShort = answer.trim().length < MIN_ANSWER_CHARS;

	const submit = async () => {
		setState({ loading: true });
		const res = await requestExplainReview(prompt.id, answer);
		if ("error" in res) {
			setState({ loading: false, error: res.error });
			return;
		}
		const misconception = prompt.misconceptions.find((m) => m.id === res.review.misconception);
		// Concepto erróneo detectado → "A reforzar" y al repaso; buena explicación → refuerza
		const record = {
			questionId: prompt.id,
			chosen: `explain:${res.review.score}`,
			correct: !misconception && res.review.score >= 2,
			confidence: misconception ? ("seguro" as const) : ("creo" as const),
			concepts: [concept, ...conceptsForQuestion({ concepts: ["ia-explicar"] })],
		};
		const learned = useLearning.getState().recordAnswer(record);
		if (user) void pushAnswer(user.id, record, learned.cards, useLearning.getState().streak);
		setState({ loading: false, review: res.review, returns: learned.returns });
	};

	const review = state.review;
	const misconception = review ? prompt.misconceptions.find((m) => m.id === review.misconception) : undefined;

	return (
		<section className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:px-6">
			<Link to="/explica" className="inline-flex min-h-8 items-center gap-1 font-mono text-xs text-muted hover:text-fg">
				<ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Explícalo tú · {index + 1} de {EXPLAIN_PROMPTS.length}
			</Link>
			<p className="mt-3 w-fit rounded-full border border-line bg-surface2 px-3 py-1 font-mono text-xs text-muted">
				{concept.area} · {concept.name}
			</p>
			<h1 className="mt-3 font-display text-xl font-bold leading-snug sm:text-2xl">{prompt.question}</h1>
			{prompt.code && <CodeBlock code={prompt.code} lang={prompt.concept.startsWith("rls") || prompt.concept.startsWith("sql") ? "sql" : prompt.concept.startsWith("a11y") ? "html" : "javascript"} className="mt-4" />}

			<label htmlFor="explicacion" className="mt-5 block text-sm font-semibold">
				Tu explicación
			</label>
			<p id="explicacion-ayuda" className="text-xs text-muted">
				Con tus palabras, en 2-4 frases. Claude la corrige con una rúbrica de 3 puntos clave.
			</p>
			<textarea
				id="explicacion"
				aria-describedby="explicacion-ayuda explicacion-cuenta"
				value={answer}
				onChange={(e) => setAnswer(e.target.value.slice(0, MAX_ANSWER_CHARS))}
				disabled={state.loading || !!review}
				rows={6}
				className="mt-2 w-full rounded-xl border border-line bg-surface p-3 leading-relaxed"
			/>
			<p id="explicacion-cuenta" className="text-right font-mono text-xs text-muted">
				{answer.length}/{MAX_ANSWER_CHARS}
			</p>

			{!review && (
				<button
					type="button"
					onClick={() => void submit()}
					disabled={tooShort || state.loading}
					className="mt-2 inline-flex min-h-12 items-center gap-2 rounded-lg bg-accent px-5 font-semibold text-accent-fg hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-surface2 disabled:text-muted"
				>
					{state.loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
					{state.loading ? "Corrigiendo…" : "Corregir con Claude"}
				</button>
			)}

			<div aria-live="polite">
				{state.error && (
					<p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-warn/50 bg-warn-soft p-3 text-sm">
						<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
						{state.error}
					</p>
				)}
				{review && (
					<section aria-labelledby="correccion" className="mt-5 space-y-4 rounded-2xl border border-line bg-surface p-4">
						<div className="flex items-center gap-3">
							<h2 id="correccion" className="font-display text-lg font-bold">
								{review.score}/3 puntos clave
							</h2>
							<span className="flex gap-1" aria-hidden="true">
								{[0, 1, 2].map((i) => (
									<span key={i} className={`h-2.5 w-6 rounded-full ${i < review.score ? "bg-accent" : "bg-surface2"}`} />
								))}
							</span>
						</div>
						<p className="leading-relaxed">{review.feedback}</p>
						{misconception && (
							<p className="flex items-start gap-2 rounded-lg border border-warn/50 bg-warn-soft p-3 text-sm">
								<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
								<span>
									<strong>Concepto erróneo detectado:</strong> {misconception.description}. Lo hemos marcado «A reforzar».
								</span>
							</p>
						)}
						<div className="grid gap-3 sm:grid-cols-2">
							<div>
								<h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">Cubriste</h3>
								<ul className="mt-1 space-y-1 text-sm">
									{review.covered.length ? (
										review.covered.map((p) => (
											<li key={p} className="flex gap-1.5">
												<Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" /> {p}
											</li>
										))
									) : (
										<li className="text-muted">Ningún punto clave todavía</li>
									)}
								</ul>
							</div>
							<div>
								<h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-warn">Te faltó</h3>
								<ul className="mt-1 space-y-1 text-sm">
									{review.missing.length ? (
										review.missing.map((p) => (
											<li key={p} className="flex gap-1.5">
												<X className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" /> {p}
											</li>
										))
									) : (
										<li className="text-muted">¡Nada!</li>
									)}
								</ul>
							</div>
						</div>
						<details className="text-sm">
							<summary className="min-h-8 cursor-pointer text-muted hover:text-fg">Ver una respuesta modelo</summary>
							<p className="mt-1 leading-relaxed">{prompt.modelAnswer}</p>
						</details>
						{state.returns && (
							<p className="flex items-center gap-1.5 text-sm text-muted">
								<Repeat className="h-4 w-4" aria-hidden="true" /> {concept.name} vuelve a tu repaso {state.returns}.
							</p>
						)}
						<div className="flex flex-wrap gap-2">
							<button
								type="button"
								onClick={() => {
									setState({ loading: false });
								}}
								className="min-h-touch rounded-md border border-line bg-surface2 px-4 text-sm font-medium hover:border-accent/60"
							>
								Reescribir
							</button>
							{next && (
								<Link to={`/explica/${next.id}`} className="inline-flex min-h-touch items-center rounded-md bg-accent px-4 text-sm font-semibold text-accent-fg hover:bg-accent/90">
									Siguiente pregunta
								</Link>
							)}
						</div>
					</section>
				)}
			</div>
		</section>
	);
}
