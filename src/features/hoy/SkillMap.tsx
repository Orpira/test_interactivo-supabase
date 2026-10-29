import { useState } from "react";
import { Link } from "react-router-dom";
import { Target } from "lucide-react";
import { STATE_LABEL, type ConceptState } from "@/features/learning/fsrs";
import { useLearning } from "@/features/learning/store";
import { groupByArea, useConceptCatalog } from "@/features/learning/useConceptCatalog";

const CHIP: Record<ConceptState, string> = {
	dominado: "border-accent bg-accent text-accent-fg",
	progreso: "border-accent bg-accent-soft text-fg",
	reforzar: "border-warn bg-warn text-warn-fg",
	nuevo: "border-dashed border-muted/60 bg-transparent text-muted",
};
const TEXT: Record<ConceptState, string> = { dominado: "text-accent", progreso: "text-accent", reforzar: "text-warn", nuevo: "text-muted" };

/** Mapa de habilidades: conceptos por área en 4 estados, con detalle al pulsar. */
export default function SkillMap({ headingLevel = 2 }: { headingLevel?: 1 | 2 }) {
	const cards = useLearning((s) => s.cards);
	const groups = groupByArea(useConceptCatalog(), cards);
	const [selected, setSelected] = useState<string | null>(null);
	const card = selected ? cards[selected] : undefined;
	const selectedName = selected ? (groups.flatMap((g) => g.concepts).find((c) => c.id === selected)?.name ?? selected) : "";
	const state: ConceptState = card?.state ?? "nuevo";
	const H = headingLevel === 1 ? "h1" : "h2";
	const H3 = headingLevel === 1 ? "h2" : "h3";

	return (
		<section aria-labelledby="mapa-titulo" className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
			<H id="mapa-titulo" className="font-display text-xl font-bold">
				Mapa de habilidades
			</H>
			<p className="text-sm text-muted">Pulsa un concepto para ver por qué está en ese estado.</p>
			<ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Leyenda">
				{(Object.keys(STATE_LABEL) as ConceptState[]).map((s) => (
					<li key={s} className="inline-flex items-center gap-1.5">
						<span className={`inline-block h-3 w-3 rounded-full border ${CHIP[s]}`} aria-hidden="true" />
						{STATE_LABEL[s]}
					</li>
				))}
			</ul>
			<div className="mt-4 space-y-3">
				{groups.map(({ area, concepts }) => (
					<div key={area} className="flex flex-col gap-2 sm:flex-row sm:items-start">
						<H3 className="w-[110px] shrink-0 pt-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-muted">{area}</H3>
						<ul className="flex flex-wrap gap-2">
							{concepts.map((c) => {
								const s: ConceptState = cards[c.id]?.state ?? "nuevo";
								const active = selected === c.id;
								return (
									<li key={c.id}>
										<button
											type="button"
											onClick={() => setSelected(active ? null : c.id)}
											aria-pressed={active}
											aria-label={`${c.name}: ${STATE_LABEL[s]}`}
											className={`min-h-9 rounded-full border px-3 font-mono text-xs font-semibold transition ${CHIP[s]} ${
												active ? "outline outline-2 outline-offset-2 outline-fg" : "hover:opacity-90"
											}`}
										>
											{c.name}
										</button>
									</li>
								);
							})}
						</ul>
					</div>
				))}
			</div>
			<div aria-live="polite">
				{selected && (
					<div className="mt-4 flex flex-col gap-3 rounded-xl border border-line bg-surface2 p-3 sm:flex-row sm:items-center">
						<div className="min-w-0 flex-1">
							<p className="font-semibold">
								{selectedName} · <span className={TEXT[state]}>{STATE_LABEL[state]}</span>
							</p>
							<p className="text-sm text-muted">{card?.lastReason ?? "Aún no has respondido preguntas de este concepto."}</p>
						</div>
						<Link
							to={`/repaso?conceptos=${encodeURIComponent(selected)}&count=5`}
							className="inline-flex min-h-touch items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg hover:bg-accent/90"
						>
							<Target className="h-4 w-4" aria-hidden="true" /> Practicar 5 preguntas
						</Link>
					</div>
				)}
			</div>
		</section>
	);
}
