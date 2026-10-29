import { Bug, Smartphone } from "lucide-react";
import { LEVEL_LABEL } from "@/features/editor/languages";
import { AREA_LABEL, type IncidentSpec } from "./types";

const PRIORITY = {
	alta: "border-warn/50 bg-warn-soft text-warn",
	media: "border-accent/40 bg-accent-soft text-accent",
	baja: "border-line bg-surface2 text-muted",
};

/** Ticket de soporte: quién lo reporta, pasos, esperado y real. */
export default function TicketPanel({
	incident,
	compact = false,
	heading: Heading = "h1",
}: {
	incident: IncidentSpec;
	compact?: boolean;
	heading?: "h1" | "h2";
}) {
	const t = incident.ticket;
	return (
		<article aria-labelledby="ticket-title" className="space-y-3 text-sm">
			<div className="flex flex-wrap items-center gap-2 font-mono text-xs">
				<span className="inline-flex items-center gap-1 font-semibold text-accent">
					<Bug className="h-3.5 w-3.5" aria-hidden="true" /> TICKET #{incident.number}
				</span>
				<span className={`rounded-full border px-2 py-0.5 font-semibold uppercase ${PRIORITY[t.priority]}`}>
					Prioridad {t.priority}
				</span>
				<span className="rounded-full border border-line px-2 py-0.5 text-muted">{AREA_LABEL[incident.area]}</span>
				<span className="rounded-full border border-line px-2 py-0.5 text-muted">{LEVEL_LABEL[incident.difficulty]}</span>
			</div>
			<Heading id="ticket-title" className="font-display text-lg font-bold leading-snug sm:text-xl">
				{incident.title}
			</Heading>
			<p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
				<span>Reporta: {t.reporter}</span>
				<span className="inline-flex items-center gap-1">
					<Smartphone className="h-3.5 w-3.5" aria-hidden="true" /> {t.device}
				</span>
			</p>
			{!compact && (
				<>
					<div>
						<h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">Pasos para reproducir</h2>
						<ol className="mt-1 list-decimal space-y-0.5 pl-5">
							{t.steps.map((s) => (
								<li key={s}>{s}</li>
							))}
						</ol>
					</div>
					<dl className="grid gap-2 sm:grid-cols-2">
						<div className="rounded-lg border border-line bg-surface2 p-2.5">
							<dt className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">Esperado</dt>
							<dd className="mt-0.5">{t.expected}</dd>
						</div>
						<div className="rounded-lg border border-warn/40 bg-warn-soft p-2.5">
							<dt className="font-mono text-xs font-semibold uppercase tracking-widest text-warn">Real</dt>
							<dd className="mt-0.5">{t.actual}</dd>
						</div>
					</dl>
				</>
			)}
		</article>
	);
}
