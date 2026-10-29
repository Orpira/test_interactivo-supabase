import { Link } from "react-router-dom";
import { MessageSquareText } from "lucide-react";
import { EXPLAIN_PROMPTS } from "@/content/explain";
import { conceptsForQuestion } from "@/features/learning/concepts";

/** /explica: preguntas abiertas corregidas por Claude. */
export default function ExplainList() {
	return (
		<section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
			<p className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-accent">
				<MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" /> Explícalo tú
			</p>
			<h1 className="mt-1 text-3xl font-bold">Si lo sabes explicar, lo sabes</h1>
			<p className="mt-2 max-w-2xl text-muted">
				Responde con tus palabras. Claude compara tu explicación con 3 puntos clave y detecta las confusiones típicas, que pasan a tu repaso.
			</p>
			<ul className="mt-6 grid gap-3 sm:grid-cols-2">
				{EXPLAIN_PROMPTS.map((p) => {
					const [c] = conceptsForQuestion({ concepts: [p.concept] });
					return (
						<li key={p.id}>
							<Link to={`/explica/${p.id}`} className="group flex h-full flex-col gap-1.5 rounded-xl border border-line bg-surface p-4 hover:border-accent/60">
								<span className="font-mono text-xs text-muted">
									{c.area} · {c.name}
								</span>
								<span className="font-semibold leading-snug group-hover:text-accent">{p.question}</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
