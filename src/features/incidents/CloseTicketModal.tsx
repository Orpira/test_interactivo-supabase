import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, List, Share2 } from "lucide-react";
import type { ScoreResult } from "./scoring";
import { shareCard } from "./shareCard";
import { formatClock, type TimelineEvent } from "./timeline";
import type { IncidentSpec } from "./types";
import TimelineList from "./TimelineList";

export type CloseSummary = {
	score: ScoreResult;
	durationMs: number;
	submits: number;
	linesChanged: number;
	referenceLines: number;
	timeline: TimelineEvent[];
};

/** Cierre de la incidencia: métricas, causa raíz, línea de tiempo y compartir. */
export default function CloseTicketModal({
	incident,
	summary,
	onNext,
	onList,
	onClose,
}: {
	incident: IncidentSpec;
	summary: CloseSummary;
	onNext?: () => void;
	onList: () => void;
	onClose: () => void;
}) {
	const heading = useRef<HTMLHeadingElement>(null);
	const [shareMsg, setShareMsg] = useState("");

	useEffect(() => {
		heading.current?.focus();
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.stopPropagation();
				onClose();
			}
		};
		window.addEventListener("keydown", onKey, true);
		return () => window.removeEventListener("keydown", onKey, true);
	}, [onClose]);

	const share = async () => {
		try {
			const r = await shareCard({
				number: incident.number,
				title: incident.title,
				score: summary.score.total,
				durationMs: summary.durationMs,
				submits: summary.submits,
				linesChanged: summary.linesChanged,
				referenceLines: summary.referenceLines,
			});
			setShareMsg(r === "downloaded" ? "Tarjeta descargada como PNG." : r === "shared" ? "¡Compartida!" : "");
		} catch {
			setShareMsg("No se pudo generar la tarjeta.");
		}
	};

	const metrics = [
		{ k: "Tiempo", v: formatClock(summary.durationMs) },
		{ k: "Envíos", v: String(summary.submits) },
		{ k: "Líneas cambiadas", v: `${summary.linesChanged}`, sub: `referencia: ${summary.referenceLines}` },
		{ k: "Puntos", v: String(summary.score.total), strong: true },
	];

	return (
		<div
			className="fixed inset-0 z-[60] flex items-end justify-center bg-bg/80 backdrop-blur-sm sm:items-center sm:px-4"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="close-title"
				className="max-h-[92dvh] w-full max-w-2xl overflow-auto rounded-t-2xl border border-line bg-surface p-5 shadow-2xl sm:rounded-2xl sm:p-7"
			>
				<p className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-accent">
					<CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Arreglo aceptado
				</p>
				<h2 id="close-title" ref={heading} tabIndex={-1} className="mt-1 font-mono text-2xl font-bold tracking-tight outline-none sm:text-3xl">
					TICKET #{incident.number} CERRADO
				</h2>
				<p className="mt-1 text-muted">{incident.title}</p>

				<dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
					{metrics.map((m) => (
						<div key={m.k} className={`rounded-xl border p-3 ${m.strong ? "border-accent/50 bg-accent-soft" : "border-line bg-surface2"}`}>
							<dt className="font-mono text-[0.7rem] font-semibold uppercase tracking-widest text-muted">{m.k}</dt>
							<dd className={`mt-0.5 font-mono text-xl font-bold ${m.strong ? "text-accent" : ""}`}>{m.v}</dd>
							{m.sub && <dd className="font-mono text-[0.7rem] text-muted">{m.sub}</dd>}
						</div>
					))}
				</dl>

				<details className="mt-3 text-sm">
					<summary className="min-h-8 cursor-pointer text-muted hover:text-fg">Desglose de la puntuación</summary>
					<ul className="mt-1 space-y-0.5 font-mono text-xs">
						{summary.score.lines.map((l) => (
							<li key={l.label} className="flex justify-between gap-2">
								<span>{l.label}</span>
								<span className={l.points < 0 ? "text-warn" : "text-accent"}>
									{l.points > 0 ? "+" : ""}
									{l.points}
								</span>
							</li>
						))}
					</ul>
				</details>

				<section className="mt-5" aria-labelledby="root-cause">
					<h3 id="root-cause" className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">
						Causa raíz
					</h3>
					<p className="mt-1 text-sm leading-relaxed">{incident.rootCause}</p>
				</section>

				<section className="mt-5" aria-labelledby="timeline-title">
					<h3 id="timeline-title" className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">
						Tu diagnóstico
					</h3>
					<TimelineList events={summary.timeline} className="mt-2 max-h-56 overflow-auto" />
				</section>

				<div className="mt-6 flex flex-wrap items-center gap-2">
					{onNext && (
						<button
							type="button"
							onClick={onNext}
							className="inline-flex min-h-touch items-center gap-2 rounded-md bg-accent px-4 font-semibold text-accent-fg hover:bg-accent/90"
						>
							Siguiente incidencia <ArrowRight className="h-4 w-4" aria-hidden="true" />
						</button>
					)}
					<button
						type="button"
						onClick={() => void share()}
						className="inline-flex min-h-touch items-center gap-2 rounded-md border border-line bg-surface2 px-4 font-medium hover:border-accent/60"
					>
						<Share2 className="h-4 w-4" aria-hidden="true" /> Compartir tarjeta
					</button>
					<button type="button" onClick={onList} className="inline-flex min-h-touch items-center gap-2 rounded-md px-3 text-muted hover:text-fg">
						<List className="h-4 w-4" aria-hidden="true" /> Todas las incidencias
					</button>
					<p role="status" className="w-full text-sm text-muted sm:ml-auto sm:w-auto">
						{shareMsg}
					</p>
				</div>
			</div>
		</div>
	);
}
