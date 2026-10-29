import { ArrowDown, ArrowUp, Shield } from "lucide-react";
import { PROMOTE } from "@/features/learning/league";
import { useLeague } from "@/features/learning/useLeague";

/** Liga semanal: tu grupo de 20 del mismo nivel. Suben los 5 primeros. */
export default function LeagueTable() {
	const { rows, summary, loading, unavailable } = useLeague();
	if (loading) return null;
	return (
		<section id="liga" aria-labelledby="liga-titulo" className="mb-8 rounded-2xl border border-line bg-surface p-4 sm:p-5">
			<div className="flex flex-wrap items-baseline justify-between gap-2">
				<h2 id="liga-titulo" className="flex items-center gap-2 font-display text-xl font-bold">
					<Shield className="h-5 w-5 text-accent" aria-hidden="true" /> Liga semanal{summary ? ` · ${summary.division}` : ""}
				</h2>
				{summary && (
					<p className="text-sm text-muted">
						Quedan {summary.daysLeft} {summary.daysLeft === 1 ? "día" : "días"} · suben los {PROMOTE} primeros
					</p>
				)}
			</div>
			{unavailable || rows.length === 0 ? (
				<p className="mt-2 text-sm text-muted">La liga se activa al aplicar la migración de la Fase 4 y completar tu primer quiz de la semana.</p>
			) : (
				<ol className="mt-3 divide-y divide-line">
					{rows.map((r) => {
						const up = r.position <= PROMOTE && r.points > 0;
						const down = rows.length > PROMOTE * 2 && r.position > rows.length - PROMOTE;
						return (
							<li key={r.user_id} className={`flex items-center gap-3 py-2 text-sm ${r.is_me ? "font-semibold" : ""}`} aria-current={r.is_me ? "true" : undefined}>
								<span className="w-6 text-right font-mono text-muted">{r.position}</span>
								<span className={`min-w-0 flex-1 truncate ${r.is_me ? "text-accent" : ""}`}>
									{r.name}
									{r.is_me && " (tú)"}
								</span>
								{up && <ArrowUp className="h-4 w-4 text-accent" aria-label="zona de ascenso" />}
								{down && <ArrowDown className="h-4 w-4 text-warn" aria-label="zona de descenso" />}
								<span className="w-14 text-right font-mono">{r.points} pts</span>
							</li>
						);
					})}
				</ol>
			)}
		</section>
	);
}
