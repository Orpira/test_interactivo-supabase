import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Bug, CheckCircle2, Clock, Laptop, Smartphone, Tablet } from "lucide-react";
import { INCIDENTS } from "@/content/incidents";
import { LEVEL_LABEL } from "@/features/editor/languages";
import { getClosedIncidents } from "./session";
import { formatClock } from "./timeline";
import { AREA_LABEL, type IncidentArea } from "./types";

const DEVICE = { 390: Smartphone, 768: Tablet, 1280: Laptop } as const;
const AREAS: IncidentArea[] = ["css", "javascript", "accesibilidad", "seguridad"];

/** /incidencias: tickets abiertos agrupados por área. */
export default function IncidentList() {
	const closed = useMemo(() => getClosedIncidents(), []);
	const done = INCIDENTS.filter((i) => closed[i.id]).length;

	return (
		<section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
			<p className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-accent">
				<Bug className="h-3.5 w-3.5" aria-hidden="true" /> Modo Incidencia
			</p>
			<h1 className="mt-1 text-3xl font-bold">Arregla bugs de verdad</h1>
			<p className="mt-2 max-w-2xl text-muted">
				Cada ticket es una mini-app rota. Reprodúcelo, investiga con Elementos, Consola y Red, y envía el arreglo mínimo
				sin romper lo que ya funcionaba.
			</p>
			<p className="mt-3 font-mono text-sm">
				<span className="text-accent">{done}</span>/{INCIDENTS.length} tickets cerrados
			</p>

			{AREAS.map((area) => {
				const list = INCIDENTS.filter((i) => i.area === area);
				if (!list.length) return null;
				return (
					<div key={area} className="mt-8">
						<h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">{AREA_LABEL[area]}</h2>
						<ul className="mt-3 grid gap-3 sm:grid-cols-2">
							{list.map((i) => {
								const c = closed[i.id];
								const Device = DEVICE[i.viewport];
								return (
									<li key={i.id}>
										<Link
											to={`/incidencias/${i.id}`}
											className="group flex h-full flex-col gap-2 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-accent/60"
										>
											<span className="flex items-center gap-2 font-mono text-xs">
												<span className="font-semibold text-accent">#{i.number}</span>
												<span
													className={`rounded-full border px-2 py-0.5 uppercase ${
														i.ticket.priority === "alta" ? "border-warn/50 text-warn" : "border-line text-muted"
													}`}
												>
													{i.ticket.priority}
												</span>
												<span className="text-muted">{LEVEL_LABEL[i.difficulty]}</span>
												{c && (
													<span className="ml-auto inline-flex items-center gap-1 text-accent">
														<CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> {c.score} pts
													</span>
												)}
											</span>
											<span className="font-semibold leading-snug group-hover:text-accent">{i.title}</span>
											<span className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
												<span className="inline-flex items-center gap-1">
													<Device className="h-3.5 w-3.5" aria-hidden="true" /> {i.viewport}px
												</span>
												<span className="inline-flex items-center gap-1">
													<Clock className="h-3.5 w-3.5" aria-hidden="true" /> ~{i.durationMin} min
												</span>
												<span>{i.concepts.join(" · ")}</span>
												{c && <span className="sr-only">Cerrado en {formatClock(c.durationMs)}</span>}
											</span>
										</Link>
									</li>
								);
							})}
						</ul>
					</div>
				);
			})}
		</section>
	);
}
