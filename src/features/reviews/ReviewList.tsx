import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Bot, CheckCircle2 } from "lucide-react";
import { REVIEWS } from "@/content/reviews";
import { LEVEL_LABEL } from "@/features/editor/languages";
import { getReviewScores } from "./progress";
import { POINTS } from "./scoring";

/** /revisiones: PRs "generados por IA" para revisar. */
export default function ReviewList() {
	const scores = useMemo(() => getReviewScores(), []);
	return (
		<section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
			<p className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-accent">
				<Bot className="h-3.5 w-3.5" aria-hidden="true" /> Revisa el código de la IA
			</p>
			<h1 className="mt-1 text-3xl font-bold">¿Lo aprobarías?</h1>
			<p className="mt-2 max-w-2xl text-muted">
				Cada PR lo ha escrito una IA y «funciona», pero esconde 2 o 3 fallos sutiles de seguridad, bugs, rendimiento o accesibilidad.
				Encuéntralos sin comentar lo que está bien.
			</p>
			<ul className="mt-6 grid gap-3 sm:grid-cols-2">
				{REVIEWS.map((r) => (
					<li key={r.id}>
						<Link to={`/revisiones/${r.id}`} className="group flex h-full flex-col gap-1.5 rounded-xl border border-line bg-surface p-4 hover:border-accent/60">
							<span className="flex items-center gap-2 font-mono text-xs text-muted">
								{r.file}
								{scores[r.id] !== undefined && (
									<span className="ml-auto inline-flex items-center gap-1 text-accent">
										<CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> {scores[r.id]}/{r.issues.length * POINTS.found}
									</span>
								)}
							</span>
							<span className="font-semibold group-hover:text-accent">{r.title}</span>
							<span className="text-xs text-muted">
								{LEVEL_LABEL[r.difficulty]} · {r.issues.length} fallos ocultos
							</span>
						</Link>
					</li>
				))}
			</ul>
		</section>
	);
}
