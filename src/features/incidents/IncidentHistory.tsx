import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { getIncident } from "@/content/incidents";
import TimelineList from "./TimelineList";
import { formatClock, type TimelineEvent } from "./timeline";

type Row = {
	id: string;
	challenge_id: string;
	score: number | null;
	duration_ms: number | null;
	hints_used: number;
	timeline: TimelineEvent[] | null;
	created_at: string;
};

/** Historial: incidencias cerradas con su línea de tiempo del diagnóstico. */
export default function IncidentHistory({ userId }: { userId: string }) {
	const [rows, setRows] = useState<Row[] | null>(null);
	const [error, setError] = useState(false);

	useEffect(() => {
		let cancelled = false;
		void (async () => {
			const { data, error } = await supabase
				.from("challenge_attempts")
				.select("id, challenge_id, score, duration_ms, hints_used, timeline, created_at")
				.eq("user_id", userId)
				.eq("passed", true)
				.like("challenge_id", "inc-%")
				.order("created_at", { ascending: false })
				.limit(50);
			if (cancelled) return;
			if (error) setError(true);
			setRows((data ?? []) as Row[]);
		})();
		return () => {
			cancelled = true;
		};
	}, [userId]);

	if (!rows) return <p className="text-center">Cargando...</p>;
	if (error) return <p className="text-center text-muted">No se pudo cargar el historial de incidencias.</p>;
	if (rows.length === 0)
		return (
			<p className="text-center">
				Aún no has cerrado ninguna incidencia.{" "}
				<Link to="/incidencias" className="text-accent underline">
					Ver tickets abiertos
				</Link>
			</p>
		);

	return (
		<ul className="space-y-3">
			{rows.map((r) => {
				const inc = getIncident(r.challenge_id);
				return (
					<li key={r.id} className="rounded-xl border border-line bg-surface p-4">
						<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
							<span className="font-mono text-sm font-semibold text-accent">#{inc?.number ?? r.challenge_id}</span>
							<span className="font-semibold">{inc?.title ?? r.challenge_id}</span>
							<span className="ml-auto font-mono text-sm">{r.score ?? "–"} pts</span>
						</div>
						<p className="mt-1 font-mono text-xs text-muted">
							{new Date(r.created_at).toLocaleString()} · {formatClock(r.duration_ms ?? 0)} · {r.hints_used} pista(s)
						</p>
						{r.timeline && r.timeline.length > 0 && (
							<details className="mt-2">
								<summary className="min-h-8 cursor-pointer text-sm text-accent">Ver línea de tiempo</summary>
								<TimelineList events={r.timeline} className="mt-2" />
							</details>
						)}
					</li>
				);
			})}
		</ul>
	);
}
