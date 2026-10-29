import { Link } from "react-router-dom";
import { ArrowRight, Bot, Bug, Compass, Database, Gauge, GitBranch, Accessibility, MessageSquareText, Repeat, ShieldAlert } from "lucide-react";
import { QUIZ_CATEGORIES } from "@/components/nav/navData";
import { dueConcepts, useLearning } from "@/features/learning/store";
import AppShell from "./AppShell";

/** /practicar: quizzes por área, repaso y diagnóstico en una sola pantalla. */
export default function PracticarPage() {
	const due = dueConcepts(useLearning((s) => s.cards)).length;
	return (
		<AppShell>
			<h1 className="font-display text-3xl font-bold">Practicar</h1>
			<p className="mt-1 text-muted">Elige un área o deja que el repaso elija por ti.</p>
			<div className="mt-5 grid gap-3 sm:grid-cols-2">
				<Link to="/repaso" className="flex items-center gap-3 rounded-2xl border border-accent/50 bg-accent-soft p-4 hover:border-accent">
					<Repeat className="h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
					<span className="min-w-0 flex-1">
						<span className="block font-semibold">Repaso de hoy</span>
						<span className="block text-sm text-muted">{due ? `${due} conceptos pendientes` : "Sin pendientes por ahora"}</span>
					</span>
					<ArrowRight className="h-5 w-5 text-accent" aria-hidden="true" />
				</Link>
				<Link to="/diagnostico" className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-accent/60">
					<Compass className="h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
					<span className="min-w-0 flex-1">
						<span className="block font-semibold">Diagnóstico de nivel</span>
						<span className="block text-sm text-muted">8 preguntas · 3 min</span>
					</span>
					<ArrowRight className="h-5 w-5 text-muted" aria-hidden="true" />
				</Link>
			</div>
			<h2 className="mt-8 font-mono text-xs font-semibold uppercase tracking-widest text-muted">Quizzes por área</h2>
			<ul className="mt-3 grid gap-3 sm:grid-cols-2">
				{QUIZ_CATEGORIES.map(({ key, label, desc, icon: Icon }) => (
					<li key={key}>
						<Link to={`/quiz/${key}?count=10`} className="flex h-full items-center gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-accent/60">
							<Icon className="h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
							<span className="min-w-0 flex-1">
								<span className="block font-semibold">{label}</span>
								<span className="block text-sm text-muted">{desc} · 10 preguntas</span>
							</span>
							<ArrowRight className="h-5 w-5 text-muted" aria-hidden="true" />
						</Link>
					</li>
				))}
			</ul>
			<h2 className="mt-8 font-mono text-xs font-semibold uppercase tracking-widest text-muted">Hacer el trabajo</h2>
			<ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{TOPICS.map(({ to, label, desc, icon: Icon }) => (
					<li key={to}>
						<Link to={to} className="flex h-full items-start gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-accent/60">
							<Icon className="mt-0.5 h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
							<span className="min-w-0 flex-1">
								<span className="block font-semibold">{label}</span>
								<span className="block text-sm text-muted">{desc}</span>
							</span>
						</Link>
					</li>
				))}
			</ul>
		</AppShell>
	);
}

const TOPICS = [
	{ to: "/incidencias", label: "Modo Incidencia", desc: "Depura bugs reales a partir de un ticket", icon: Bug },
	{ to: "/revisiones", label: "Revisa el código de la IA", desc: "Encuentra los fallos sutiles de un PR", icon: Bot },
	{ to: "/explica", label: "Explícalo tú", desc: "Explica con tus palabras; corrige Claude", icon: MessageSquareText },
	{ to: "/sql", label: "Laboratorio SQL", desc: "PostgreSQL real en el navegador", icon: Database },
	{ to: "/git", label: "Git en escenarios", desc: "Sal de los líos con un terminal simulado", icon: GitBranch },
	{ to: "/editor?categoria=accesibilidad", label: "Accesibilidad", desc: "Pasa una auditoría WCAG real", icon: Accessibility },
	{ to: "/editor?categoria=seguridad", label: "Seguridad web", desc: "Explota el fallo y parchéalo", icon: ShieldAlert },
	{ to: "/editor?categoria=rendimiento", label: "Rendimiento", desc: "Mide antes y después", icon: Gauge },
];
