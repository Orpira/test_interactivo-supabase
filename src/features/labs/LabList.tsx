import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Database, GitBranch } from "lucide-react";
import { SQL_EXERCISES } from "@/content/topics/sql";
import { GIT_SCENARIOS } from "@/content/topics/git";
import { LEVEL_LABEL } from "@/features/editor/languages";
import { getSolved } from "@/features/sql/progress";
import { getGitSolved } from "@/features/git/progress";

const LABS = {
	sql: {
		icon: Database,
		eyebrow: "Laboratorio SQL",
		title: "PostgreSQL de verdad, en tu navegador",
		blurb: "Consultas sobre una tienda real (clientes, productos, pedidos). Se comprueba el resultado, no cómo lo escribas. Cada ejecución se deshace: no puedes romper nada.",
		items: SQL_EXERCISES,
		solved: getSolved,
		path: "/sql",
	},
	git: {
		icon: GitBranch,
		eyebrow: "Git en escenarios",
		title: "Sal de los líos de Git",
		blurb: "Situaciones reales («hice commit en main por error») con un terminal y un repositorio en memoria. Ningún comando puede estropear nada: reinicia cuando quieras.",
		items: GIT_SCENARIOS,
		solved: getGitSolved,
		path: "/git",
	},
};

export default function LabList({ lab }: { lab: keyof typeof LABS }) {
	const cfg = LABS[lab];
	const solved = useMemo(() => cfg.solved(), [cfg]);
	const Icon = cfg.icon;
	return (
		<section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
			<p className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-accent">
				<Icon className="h-3.5 w-3.5" aria-hidden="true" /> {cfg.eyebrow}
			</p>
			<h1 className="mt-1 text-3xl font-bold">{cfg.title}</h1>
			<p className="mt-2 max-w-2xl text-muted">{cfg.blurb}</p>
			<p className="mt-3 font-mono text-sm">
				<span className="text-accent">{cfg.items.filter((i) => solved.has(i.id)).length}</span>/{cfg.items.length} resueltos
			</p>
			<ol className="mt-6 grid gap-3 sm:grid-cols-2">
				{cfg.items.map((item, i) => (
					<li key={item.id}>
						<Link to={`${cfg.path}/${item.id}`} className="group flex h-full items-start gap-3 rounded-xl border border-line bg-surface p-4 hover:border-accent/60">
							<span className="font-mono text-sm text-muted">{String(i + 1).padStart(2, "0")}</span>
							<span className="min-w-0 flex-1">
								<span className="block font-semibold group-hover:text-accent">{item.title}</span>
								<span className="text-xs text-muted">{LEVEL_LABEL[item.difficulty]}</span>
							</span>
							{solved.has(item.id) && <CheckCircle2 className="h-5 w-5 shrink-0 text-accent" aria-label="Resuelto" />}
						</Link>
					</li>
				))}
			</ol>
		</section>
	);
}
