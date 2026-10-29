import { useState } from "react";
import { MousePointerClick } from "lucide-react";
import { INSPECT_PROPS, type DomNode, type NodeInfo } from "./inspector";

/**
 * Pestaña Elementos: árbol del DOM de la vista previa y estilos calculados
 * del nodo elegido. Las propiedades sospechosas del ticket van en naranja.
 */
export default function ElementsPanel({
	tree,
	selected,
	info,
	suspects,
	onSelect,
}: {
	tree: DomNode | null;
	selected: number[] | null;
	info: NodeInfo | null;
	suspects: string[];
	onSelect: (node: DomNode) => void;
}) {
	const [showAll, setShowAll] = useState(false);
	const props = showAll || suspects.length === 0 ? INSPECT_PROPS : INSPECT_PROPS.filter((p) => suspects.includes(p) || ["display", "position", "width"].includes(p));
	const same = (a: number[] | null, b: number[]) => !!a && a.length === b.length && a.every((x, i) => x === b[i]);

	const renderNode = (n: DomNode, depth: number) => (
		<li key={n.path.join(".")}>
			<button
				type="button"
				onClick={() => onSelect(n)}
				aria-current={same(selected, n.path) ? "true" : undefined}
				style={{ paddingLeft: `${depth * 12 + 8}px` }}
				className={`block w-full truncate py-0.5 pr-2 text-left hover:bg-surface2 ${same(selected, n.path) ? "bg-accent-soft text-fg" : ""}`}
			>
				<span className="text-accent">&lt;{n.tag}</span>
				{Object.entries(n.attrs).map(([k, v]) => (
					<span key={k}>
						{" "}
						<span className="text-fg/70">{k}</span>
						{v !== "" && <span className="text-muted">="{v}"</span>}
					</span>
				))}
				<span className="text-accent">&gt;</span>
				{n.text && <span className="text-fg"> {n.text}</span>}
			</button>
			{n.children.length > 0 && <ul>{n.children.map((c) => renderNode(c, depth + 1))}</ul>}
		</li>
	);

	return (
		<section aria-label="Elementos" className="grid h-full min-h-0 grid-cols-1 font-mono text-xs sm:grid-cols-[1fr_minmax(0,15rem)]">
			<div className="min-h-0 overflow-auto border-line py-1 sm:border-r">
				{tree ? <ul>{renderNode(tree, 0)}</ul> : <p className="p-3 text-muted">Cargando el DOM…</p>}
			</div>
			<div className="min-h-0 overflow-auto border-t border-line p-2 sm:border-t-0">
				{!info ? (
					<p className="flex items-start gap-1.5 text-muted">
						<MousePointerClick className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Elige un nodo para ver sus estilos
						calculados.
					</p>
				) : (
					<>
						<p className="mb-1.5 text-muted">
							{Math.round(info.rect.width)} × {Math.round(info.rect.height)} en ({Math.round(info.rect.x)}, {Math.round(info.rect.y)})
						</p>
						<dl className="space-y-0.5">
							{props.map((p) => {
								const sus = suspects.includes(p);
								return (
									<div key={p} className={`flex justify-between gap-2 rounded px-1 ${sus ? "bg-warn-soft text-warn" : ""}`}>
										<dt>
											{p}
											{sus && <span className="sr-only"> (sospechosa)</span>}
										</dt>
										<dd className={sus ? "font-semibold" : "text-fg"}>{info.styles[p] || "—"}</dd>
									</div>
								);
							})}
						</dl>
						{suspects.length > 0 && (
							<button
								type="button"
								onClick={() => setShowAll((v) => !v)}
								className="mt-2 min-h-8 text-accent underline"
							>
								{showAll ? "Ver solo las relevantes" : "Ver todas las propiedades"}
							</button>
						)}
					</>
				)}
			</div>
		</section>
	);
}

