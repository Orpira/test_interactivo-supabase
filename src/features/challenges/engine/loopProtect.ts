import { parse } from "acorn";

type Node = {
	type: string;
	start: number;
	end: number;
	body?: Node | Node[];
	[key: string]: unknown;
};

const LOOPS = new Set([
	"ForStatement",
	"ForInStatement",
	"ForOfStatement",
	"WhileStatement",
	"DoWhileStatement",
]);

/**
 * Código que se antepone al del usuario: si un bucle encadena iteraciones
 * durante más de `limitMs` sin pausa, lanza un error en lugar de colgar la
 * página. Así un `while (true) {}` no bloquea la app.
 */
/** En una sola línea (sin salto final) para que los errores de app.js conserven su número de línea. */
export function loopGuardPrelude(limitMs = 1000) {
	return `var __wwLoop = (function () {
  var first = {}, last = {};
  return function (id) {
    var now = Date.now();
    if (!first[id] || now - last[id] > 50) first[id] = now;
    last[id] = now;
    if (now - first[id] > ${limitMs}) {
      first[id] = 0;
      throw new RangeError("Posible bucle infinito: un bucle lleva más de ${limitMs / 1000} s ejecutándose.");
    }
  };
})();`.replace(/\n\s*/g, " ");
}

/** Mensajes de error de sintaxis de acorn en español. */
export function translateAcorn(msg: string) {
	return msg
		.replace(/^Unexpected token$/, "símbolo inesperado")
		.replace(/^Unexpected character '(.+)'$/, "carácter inesperado «$1»")
		.replace(/^Unterminated string constant$/, "cadena sin cerrar")
		.replace(/^Unterminated template$/, "plantilla sin cerrar")
		.replace(/^Unterminated comment$/, "comentario sin cerrar")
		.replace(/^Identifier '(.+)' has already been declared$/, "«$1» ya está declarado")
		.replace(/^Unexpected keyword '(.+)'$/, "palabra reservada inesperada «$1»")
		.replace(/^Assigning to rvalue$/, "no se puede asignar a esta expresión");
}

export type ProtectResult =
	| { ok: true; code: string }
	| { ok: false; error: string; line?: number };

/**
 * Inserta una comprobación de tiempo al inicio de cada bucle del código.
 * Si el código tiene un error de sintaxis, lo devuelve con su línea.
 */
export function protectLoops(source: string): ProtectResult {
	let ast: Node;
	try {
		ast = parse(source, {
			ecmaVersion: "latest",
			sourceType: "script",
			allowReturnOutsideFunction: true,
			allowAwaitOutsideFunction: true,
		}) as unknown as Node;
	} catch (err) {
		const e = err as { message?: string; loc?: { line: number } };
		return {
			ok: false,
			error: `Error de sintaxis: ${translateAcorn((e.message ?? "").replace(/\s*\(\d+:\d+\)$/, ""))}`,
			line: e.loc?.line,
		};
	}

	const inserts: { pos: number; text: string }[] = [];
	let id = 0;

	const visit = (node: unknown) => {
		if (!node || typeof node !== "object") return;
		if (Array.isArray(node)) {
			node.forEach(visit);
			return;
		}
		const n = node as Node;
		if (typeof n.type !== "string") return;
		if (LOOPS.has(n.type) && n.body && !Array.isArray(n.body)) {
			const body = n.body;
			const guard = `__wwLoop(${id++});`;
			if (body.type === "BlockStatement") {
				inserts.push({ pos: body.start + 1, text: guard });
			} else {
				inserts.push({ pos: body.start, text: `{${guard}` });
				inserts.push({ pos: body.end, text: "}" });
			}
		}
		for (const key of Object.keys(n)) {
			if (key === "type" || key === "start" || key === "end") continue;
			visit(n[key]);
		}
	};
	visit(ast);

	let out = source;
	for (const ins of inserts.sort((a, b) => b.pos - a.pos)) {
		out = out.slice(0, ins.pos) + ins.text + out.slice(ins.pos);
	}
	return { ok: true, code: loopGuardPrelude() + out };
}
