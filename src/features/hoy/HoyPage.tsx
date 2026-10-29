import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bug, Compass, Flame, Shield } from "lucide-react";
import { useAuth } from "@/services/auth";
import { LEVEL_LABEL } from "@/features/editor/languages";
import { AREA_LABEL } from "@/features/incidents/types";
import { retrievability } from "@/features/learning/fsrs";
import { dueConcepts, useLearning } from "@/features/learning/store";
import { weekDots } from "@/features/learning/streak";
import { useQuizSession } from "@/store/quizSession";
import AppShell from "./AppShell";
import SkillMap from "./SkillMap";
import { DIAGNOSTIC_DONE_KEY, greeting, incidentOfDay, lastDraft, resumeQuiz } from "./today";

const DOT = {
	hecho: "bg-warn border-warn",
	protegido: "bg-accent/40 border-accent",
	perdido: "border-line bg-surface2",
	hoy: "border-dashed border-warn",
	futuro: "border-dashed border-muted/60",
};
const DOT_LABEL = { hecho: "completado", protegido: "salvado con protector", perdido: "sin actividad", hoy: "hoy, pendiente", futuro: "pendiente" };

/** /hoy: el plan del día (repaso, incidencia, continuar) y el mapa de habilidades. */
export default function HoyPage() {
	const { user } = useAuth();
	const cards = useLearning((s) => s.cards);
	const streak = useLearning((s) => s.streak);
	const session = useQuizSession();
	const now = new Date();

	const due = useMemo(() => dueConcepts(cards), [cards]);
	const fading = due.filter((c) => retrievability(c) < 0.9).slice(0, 3);
	const chips = (fading.length ? fading : due).slice(0, 3);
	const reviewQuestions = Math.min(12, due.length * 2);
	const incident = incidentOfDay(now);
	const cont = resumeQuiz(session.key, session.index, session.questions.length) ?? lastDraft();
	const name = String(user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split("@")[0] ?? "").split(" ")[0];
	const isNew = Object.keys(cards).length === 0 && !localStorage.getItem(DIAGNOSTIC_DONE_KEY);
	const dots = weekDots(streak, now);

	return (
		<AppShell>
			<div className="space-y-5">
				<header>
					<h1 className="font-display text-[1.75rem] font-bold leading-tight sm:text-[2.125rem]">
						{greeting(now)}
						{name ? `, ${name}` : ""}
					</h1>
					<p className="text-muted">Tu plan de hoy · unos 15 minutos</p>
				</header>

				<section aria-label="Racha" className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-surface px-4 py-3">
					<Flame className="h-6 w-6 text-warn" fill="currentColor" fillOpacity={streak.current ? 0.35 : 0} aria-hidden="true" />
					<div className="min-w-0 flex-1">
						<p className="font-semibold">
							Racha de {streak.current} {streak.current === 1 ? "día" : "días"}
						</p>
						<p className="flex items-center gap-1 text-xs text-muted">
							<Shield className="h-3.5 w-3.5" aria-hidden="true" />
							{streak.freezes > 0 ? "1 protector disponible" : "Protector gastado esta semana"}
						</p>
					</div>
					<ol className="flex gap-1.5" aria-label="Esta semana">
						{dots.map((d) => (
							<li key={d.key} className="flex flex-col items-center gap-1">
								<span className={`h-3.5 w-3.5 rounded-full border-2 ${DOT[d.state]}`} aria-hidden="true" />
								<span className="font-mono text-[0.65rem] text-muted" aria-hidden="true">
									{d.label}
								</span>
								<span className="sr-only">
									{d.label}: {DOT_LABEL[d.state]}
								</span>
							</li>
						))}
					</ol>
				</section>

				{isNew && (
					<Link
						to="/diagnostico"
						className="flex items-center gap-3 rounded-xl border border-accent/50 bg-accent-soft p-4 hover:border-accent"
					>
						<Compass className="h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
						<span className="min-w-0 flex-1">
							<span className="block font-semibold">Haz el diagnóstico inicial (3 min)</span>
							<span className="block text-sm text-muted">8 preguntas de todas las áreas para fijar tu nivel y tu primer repaso.</span>
						</span>
						<ArrowRight className="h-5 w-5 text-accent" aria-hidden="true" />
					</Link>
				)}

				<div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
					<section aria-labelledby="repaso-hoy" className="flex flex-col rounded-2xl border border-line bg-surface p-4">
						<p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">Repaso de hoy</p>
						{due.length > 0 ? (
							<>
								<p className="mt-1 text-sm text-muted">
									{due.length} {due.length === 1 ? "tarjeta" : "tarjetas"} · {Math.max(2, Math.round(reviewQuestions * 0.4))} min
								</p>
								<h2 id="repaso-hoy" className="mt-2 font-semibold leading-snug">
									{chips.length === 1 ? "1 concepto está a punto de olvidarse" : `${chips.length} conceptos están a punto de olvidarse`}
								</h2>
								<ul className="mt-2 flex flex-wrap gap-1.5">
									{chips.map((c) => (
										<li key={c.conceptId} className="rounded-full bg-warn-soft px-2.5 py-0.5 font-mono text-xs font-semibold text-warn">
											{c.name}
										</li>
									))}
								</ul>
								<div className="mt-auto pt-4">
									<Link
										to="/repaso"
										className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-accent font-semibold text-accent-fg hover:bg-accent/90"
									>
										Empezar repaso
									</Link>
								</div>
							</>
						) : (
							<>
								<h2 id="repaso-hoy" className="mt-2 font-semibold leading-snug">
									Nada que repasar hoy
								</h2>
								<p className="mt-1 text-sm text-muted">
									Cuando falles o adivines una pregunta, su concepto volverá aquí en el momento justo para no olvidarlo.
								</p>
								<Link
									to="/practicar"
									className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-line bg-surface2 font-semibold hover:border-accent/60"
								>
									Practicar
								</Link>
							</>
						)}
					</section>

					<section aria-labelledby="incidencia-dia" className="flex flex-col rounded-2xl border border-line bg-surface p-4">
						<p className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-warn">
							<Bug className="h-3.5 w-3.5" aria-hidden="true" /> Incidencia del día · #{incident.number}
						</p>
						<h2 id="incidencia-dia" className="mt-2 font-semibold leading-snug">
							«{incident.title}»
						</h2>
						<p className="mb-4 mt-1 text-sm text-muted">
							{AREA_LABEL[incident.area]} · {LEVEL_LABEL[incident.difficulty]} · ~{incident.durationMin} min
						</p>
						<Link
							to={`/incidencias/${incident.id}`}
							className="mt-auto inline-flex min-h-12 w-full items-center justify-center rounded-lg border-2 border-warn font-semibold text-warn hover:bg-warn-soft"
						>
							Abrir ticket
						</Link>
					</section>

					{cont && (
						<section aria-labelledby="continuar" className="flex flex-col rounded-2xl border border-line bg-surface p-4">
							<p className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">Continuar</p>
							<div className="mt-2 flex items-center gap-3">
								<div className="min-w-0 flex-1">
									<h2 id="continuar" className="truncate font-semibold">
										{cont.title}
									</h2>
									<p className="truncate text-sm text-muted">{cont.detail} · guardado automáticamente</p>
								</div>
								<Link
									to={cont.to}
									aria-label={`Continuar: ${cont.title}`}
									className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg hover:bg-accent/90"
								>
									<ArrowRight className="h-5 w-5" aria-hidden="true" />
								</Link>
							</div>
							<div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface2" aria-hidden="true">
								<div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(cont.progress * 100)}%` }} />
							</div>
						</section>
					)}
				</div>

				<SkillMap />
			</div>
		</AppShell>
	);
}
