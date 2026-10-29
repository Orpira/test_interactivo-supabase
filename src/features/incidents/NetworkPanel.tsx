import { Info } from "lucide-react";
import type { NetworkMock, NetworkRecord } from "@/features/challenges/engine/types";

const statusClass = (s: number | null) =>
	s === null ? "text-muted" : s === 0 || s >= 400 ? "text-warn font-semibold" : "text-accent";

/** Pestaña Red: peticiones capturadas por la red simulada del iframe. */
export default function NetworkPanel({ records, expected }: { records: NetworkRecord[]; expected: NetworkMock[] }) {
	const missing = [...new Set(expected.map((e) => `${e.method} ${e.url.split("?")[0]}`))].filter(
		(k) => !records.some((r) => `${r.method} ${r.url.split("?")[0]}` === k),
	);
	return (
		<section aria-label="Red" className="flex h-full min-h-0 flex-col">
			<div className="min-h-0 flex-1 overflow-auto">
				<table className="w-full border-collapse font-mono text-xs">
					<caption className="sr-only">Peticiones de red de la vista previa</caption>
					<thead className="sticky top-0 bg-surface text-left text-muted">
						<tr className="border-b border-line">
							<th scope="col" className="px-3 py-1.5 font-semibold">Método</th>
							<th scope="col" className="px-3 py-1.5 font-semibold">URL</th>
							<th scope="col" className="px-3 py-1.5 font-semibold">Estado</th>
							<th scope="col" className="px-3 py-1.5 text-right font-semibold">Tiempo</th>
						</tr>
					</thead>
					<tbody>
						{records.map((r) => (
							<tr key={r.id} className="border-b border-line/60">
								<td className="px-3 py-1.5">{r.method}</td>
								<td className="max-w-[16rem] truncate px-3 py-1.5" title={r.body ? `Cuerpo: ${r.body}` : undefined}>
									{r.url}
								</td>
								<td className={`px-3 py-1.5 ${statusClass(r.status)}`}>
									{r.status === null ? "pendiente" : r.status === 0 ? "cancelada" : r.status}
								</td>
								<td className="px-3 py-1.5 text-right text-muted">{r.timeMs === null ? "…" : `${r.timeMs} ms`}</td>
							</tr>
						))}
					</tbody>
				</table>
				{records.length === 0 && <p className="px-3 py-3 text-xs text-muted">Aún no se ha hecho ninguna petición.</p>}
			</div>
			{missing.length > 0 && (
				<ul className="shrink-0 space-y-1 border-t border-line p-2 text-xs">
					{missing.map((m) => (
						<li key={m} className="flex items-center gap-1.5 text-warn">
							<Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Ninguna petición a {m.split(" ")[1]} ({m.split(" ")[0]})
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
