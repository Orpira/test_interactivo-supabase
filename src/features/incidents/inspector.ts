/** Tipos y utilidades del panel Elementos (inspector del iframe). */
export type DomNode = { tag: string; attrs: Record<string, string>; text: string; path: number[]; children: DomNode[] };
export type NodeInfo = { path: number[]; styles: Record<string, string>; rect: { x: number; y: number; width: number; height: number } };

export const INSPECT_PROPS = [
	"display",
	"position",
	"z-index",
	"opacity",
	"visibility",
	"pointer-events",
	"width",
	"max-width",
	"height",
	"box-sizing",
	"padding",
	"margin",
	"overflow",
	"flex-wrap",
	"transform",
	"isolation",
];

export const nodeLabel = (n: DomNode) =>
	`${n.tag}${n.attrs.id ? `#${n.attrs.id}` : ""}${n.attrs.class ? `.${n.attrs.class.trim().split(/\s+/).join(".")}` : ""}`;

