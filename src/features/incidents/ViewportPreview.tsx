import { useEffect, useRef, useState, type ReactNode } from "react";
import { Laptop, Smartphone, Tablet } from "lucide-react";

export const VIEWPORTS = [
	{ width: 390, label: "Móvil", icon: Smartphone },
	{ width: 768, label: "Tablet", icon: Tablet },
	{ width: 1280, label: "Escritorio", icon: Laptop },
] as const;

export type ViewportWidth = (typeof VIEWPORTS)[number]["width"];

/**
 * Vista previa con ancho real de dispositivo. Si no cabe en el panel se
 * escala hacia abajo (el iframe sigue midiendo el ancho elegido).
 */
export default function ViewportPreview({
	width,
	onWidth,
	reproduce,
	children,
}: {
	width: ViewportWidth;
	onWidth: (w: ViewportWidth) => void;
	/** Ancho en el que se reproduce el fallo (se marca en el selector) */
	reproduce: number;
	children: ReactNode;
}) {
	const box = useRef<HTMLDivElement>(null);
	const [size, setSize] = useState({ w: 0, h: 0 });

	useEffect(() => {
		const el = box.current;
		if (!el) return;
		const ro = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	const scale = size.w ? Math.min(1, size.w / width) : 1;

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="flex shrink-0 items-center gap-2 border-b border-line bg-surface px-2 py-1">
				<span className="px-1 font-mono text-xs font-semibold uppercase tracking-widest text-muted">Vista previa</span>
				<div role="radiogroup" aria-label="Ancho de la vista previa" className="ml-auto flex gap-1">
					{VIEWPORTS.map(({ width: w, label, icon: Icon }) => (
						<button
							key={w}
							type="button"
							role="radio"
							aria-checked={width === w}
							onClick={() => onWidth(w)}
							title={`${label} · ${w}px${w === reproduce ? " (ancho del ticket)" : ""}`}
							className={`relative inline-flex min-h-8 items-center gap-1 rounded-md px-2 font-mono text-xs ${
								width === w ? "bg-accent-soft text-fg" : "text-muted hover:bg-surface2 hover:text-fg"
							}`}
						>
							<Icon className="h-3.5 w-3.5" aria-hidden="true" />
							{w}
							<span className="sr-only">
								{" "}
								px, {label}
								{w === reproduce ? ", ancho del ticket" : ""}
							</span>
							{w === reproduce && <span className="h-1.5 w-1.5 rounded-full bg-warn" aria-hidden="true" />}
						</button>
					))}
				</div>
				{scale < 1 && <span className="font-mono text-[0.7rem] text-muted">{Math.round(scale * 100)}%</span>}
			</div>
			<div ref={box} className="relative min-h-0 flex-1 overflow-hidden bg-surface2">
				<div
					className="absolute left-1/2 top-0 origin-top bg-white shadow-sm"
					style={{
						width,
						height: size.h / scale || "100%",
						transform: `translateX(-50%) scale(${scale})`,
					}}
				>
					{children}
				</div>
			</div>
		</div>
	);
}
