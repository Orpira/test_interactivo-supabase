import { Ban, CircleAlert, Info, TriangleAlert } from "lucide-react";

export type ConsoleEntry = { id: number; level: "log" | "info" | "warn" | "error"; text: string };

const STYLE = {
	log: { icon: null, cls: "text-fg" },
	info: { icon: Info, cls: "text-accent" },
	warn: { icon: TriangleAlert, cls: "text-warn" },
	error: { icon: CircleAlert, cls: "text-warn bg-warn-soft border-warn/30" },
};

/** Consola de la vista previa: console.* y errores no capturados. */
export default function ConsolePanel({ entries, onClear }: { entries: ConsoleEntry[]; onClear: () => void }) {
	return (
		<section aria-label="Consola" className="flex h-full min-h-0 flex-col">
			<div className="flex items-center justify-between border-b border-line px-3 py-1.5">
				<h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">
					Consola {entries.length > 0 && <span className="text-fg">· {entries.length}</span>}
				</h2>
				<button
					type="button"
					onClick={onClear}
					className="inline-flex min-h-8 items-center gap-1 rounded px-2 text-xs text-muted hover:bg-surface2 hover:text-fg"
				>
					<Ban className="h-3.5 w-3.5" aria-hidden="true" /> Limpiar
				</button>
			</div>
			<ol aria-live="polite" className="min-h-0 flex-1 space-y-1 overflow-auto p-2 font-mono text-xs">
				{entries.length === 0 && <li className="px-1 py-2 text-muted">Aquí aparece lo que imprima tu código con console.log.</li>}
				{entries.map((e) => {
					const s = STYLE[e.level];
					const Icon = s.icon;
					return (
						<li key={e.id} className={`flex gap-2 rounded border border-transparent px-2 py-1 ${s.cls}`}>
							<span className="sr-only">{e.level}: </span>
							{Icon ? <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : <span className="w-3.5 shrink-0 text-muted" aria-hidden="true">›</span>}
							<span className="whitespace-pre-wrap break-words">{e.text}</span>
						</li>
					);
				})}
			</ol>
		</section>
	);
}
