import { ArrowRight, CheckCircle2, CircleDashed, Loader2, PartyPopper, TriangleAlert } from "lucide-react";
import type { ChallengeTest, TestResult } from "../engine/types";

/** Tests en vivo: gris (pendiente), azul (superado), naranja (fallado). */
export default function TestsPanel({
	tests,
	results,
	running,
	hintsShown,
	onNext,
}: {
	tests: ChallengeTest[];
	results: TestResult[] | null;
	running: boolean;
	hintsShown: number;
	onNext?: () => void;
}) {
	const passed = results?.filter((r) => r.passed).length ?? 0;
	const all = !!results && results.length > 0 && passed === results.length;

	return (
		<section aria-labelledby="tests-title" className="flex h-full min-h-0 flex-col">
			<div className="flex items-center justify-between border-b border-line px-3 py-1.5">
				<h2 id="tests-title" className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">
					Tests
				</h2>
				<span className="flex items-center gap-2 font-mono text-xs">
					{running && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" aria-label="Ejecutando" />}
					{results && (
						<span className={`font-semibold ${all ? "text-accent" : "text-warn"}`}>
							{passed}/{results.length}
						</span>
					)}
				</span>
			</div>
			<div className="min-h-0 flex-1 overflow-auto p-3">
				<ul className="space-y-2.5" aria-live="polite">
					{tests.map((t) => {
						const r = results?.find((x) => x.name === t.name);
						return (
							<li key={t.name} className="flex gap-2.5 text-sm">
								{!r ? (
									<CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-label="pendiente" />
								) : r.passed ? (
									<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-label="superado" />
								) : (
									<TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-label="fallado" />
								)}
								<span className="min-w-0">
									<span className={!r ? "text-muted" : r.passed ? "text-fg" : "text-warn"}>{t.name}</span>
									{r && !r.passed && (
										<span className="mt-0.5 block whitespace-pre-line break-words font-mono text-xs text-muted">{r.message}</span>
									)}
								</span>
							</li>
						);
					})}
				</ul>
				{all && (
					<div className="mt-4 rounded-lg border border-accent/50 bg-accent-softer p-3">
						<p className="flex items-center gap-2 font-display font-bold text-accent">
							<PartyPopper className="h-5 w-5" aria-hidden="true" /> ¡Reto superado!
						</p>
						<p className="mt-0.5 text-sm text-muted">
							{hintsShown === 0 ? "Sin pistas." : `Con ${hintsShown} pista${hintsShown > 1 ? "s" : ""}.`}
						</p>
						{onNext && (
							<button
								type="button"
								onClick={onNext}
								className="mt-3 inline-flex min-h-touch items-center gap-2 rounded-md bg-accent px-4 font-semibold text-accent-fg hover:bg-accent/90"
							>
								Siguiente reto <ArrowRight className="h-4 w-4" aria-hidden="true" />
							</button>
						)}
					</div>
				)}
			</div>
		</section>
	);
}
