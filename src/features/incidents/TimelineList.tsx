import { formatClock, type TimelineEvent, type TimelineKind } from "./timeline";

const DOT: Record<TimelineKind, string> = {
	start: "bg-muted",
	edit: "bg-line",
	hint: "bg-warn",
	panel: "bg-muted",
	viewport: "bg-muted",
	inspect: "bg-accent/60",
	"submit-fail": "bg-warn",
	regression: "bg-warn",
	solved: "bg-accent",
};

/** Línea de tiempo del diagnóstico (modal de cierre e Historial). */
export default function TimelineList({ events, className = "" }: { events: TimelineEvent[]; className?: string }) {
	return (
		<ol className={`relative space-y-1.5 border-l border-line pl-4 text-sm ${className}`}>
			{events.map((e, i) => (
				<li key={`${e.t}-${i}`} className="relative">
					<span className={`absolute -left-[1.3rem] top-1.5 h-2 w-2 rounded-full ring-2 ring-surface ${DOT[e.kind] ?? "bg-muted"}`} aria-hidden="true" />
					<span className="mr-2 font-mono text-xs text-muted">{formatClock(e.t)}</span>
					<span className={e.kind === "solved" ? "font-semibold text-accent" : e.kind === "regression" || e.kind === "submit-fail" ? "text-warn" : ""}>
						{e.label}
					</span>
				</li>
			))}
		</ol>
	);
}
