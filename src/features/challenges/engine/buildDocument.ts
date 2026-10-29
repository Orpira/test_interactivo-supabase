import type { ChallengeFiles, NetworkMock } from "./types";
import { protectLoops } from "./loopProtect";

/** Evita que el código cierre la etiqueta <script>/<style> que lo contiene. */
const escapeTag = (code: string, tag: "script" | "style") =>
	code.replace(new RegExp(`</${tag}`, "gi"), `<\\/${tag}`);

/**
 * Script que se ejecuta antes que el del usuario: reenvía console.* y errores
 * a la app (panel de consola) mediante postMessage.
 */
const CONSOLE_BRIDGE = `
(function () {
  var send = function (level, args) {
    try {
      parent.postMessage({ __webwiz: "console", level: level, args: args.map(function (a) {
        if (a instanceof Error) return a.name + ": " + a.message;
        if (typeof a === "object") { try { return JSON.stringify(a); } catch (e) { return String(a); } }
        return String(a);
      }) }, "*");
    } catch (e) {}
  };
  ["log", "info", "warn", "error"].forEach(function (level) {
    var original = console[level];
    console[level] = function () {
      var args = Array.prototype.slice.call(arguments);
      send(level, args);
      original.apply(console, args);
    };
  });
  window.addEventListener("error", function (e) {
    send("error", [(e.error && e.error.name ? e.error.name + ": " : "") + e.message + (e.lineno ? (/app[.]js$/.test(e.filename || "") ? " (app.js, línea " + e.lineno + ")" : " (línea " + e.lineno + ")") : "")]);
  });
  window.addEventListener("unhandledrejection", function (e) {
    send("error", ["Promesa rechazada: " + (e.reason && e.reason.message ? e.reason.message : String(e.reason))]);
  });
})();
`;

/**
 * Red simulada: fetch() responde con el networkLog del reto (con retardo) y
 * registra cada petición en window.__wwRequests y en el panel Red.
 */
const NETWORK_BRIDGE = `
(function () {
  var log = window.__WEBWIZ_NETWORK || [];
  window.__wwRequests = [];
  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : (input && input.url) || String(input);
    var method = String((init && init.method) || (input && input.method) || "GET").toUpperCase();
    var u = new URL(url, "https://app.local/");
    var path = u.pathname + u.search;
    var match = log.find(function (e) { return e.method === method && e.url === path; }) ||
      log.find(function (e) { return e.method === method && e.url.split("?")[0] === u.pathname && e.url.indexOf("?") === -1; });
    var body = init && typeof init.body === "string" ? init.body : null;
    var rec = { id: window.__wwRequests.length + 1, method: method, url: path, body: body, status: null, timeMs: null };
    window.__wwRequests.push(rec);
    try { parent.postMessage({ __webwiz: "network", request: rec }, "*"); } catch (e) {}
    var start = Date.now();
    var signal = init && init.signal;
    return new Promise(function (resolve, reject) {
      var abort = function () {
        clearTimeout(t);
        rec.status = 0;
        rec.timeMs = Date.now() - start;
        try { parent.postMessage({ __webwiz: "network", request: rec }, "*"); } catch (e) {}
        reject(new DOMException("La petición se canceló", "AbortError"));
      };
      if (signal && signal.aborted) return abort();
      if (signal) signal.addEventListener("abort", abort, { once: true });
      var t = setTimeout(function () {
        if (signal) signal.removeEventListener("abort", abort);
        var status = match ? match.status : 404;
        var text = match ? (typeof match.body === "string" ? match.body : JSON.stringify(match.body == null ? {} : match.body)) : '{"error":"No encontrado"}';
        rec.status = status;
        rec.timeMs = Date.now() - start;
        try { parent.postMessage({ __webwiz: "network", request: rec }, "*"); } catch (e) {}
        resolve(new Response(text, { status: status, headers: { "Content-Type": "application/json" } }));
      }, match && match.delayMs != null ? match.delayMs : 40);
    });
  };
})();
`;

/**
 * Inspector para el panel Elementos: envía el árbol DOM y los estilos
 * calculados del nodo elegido (la app no puede leer el iframe directamente).
 */
const INSPECTOR_BRIDGE = `
(function () {
  var overlay;
  function nodeAt(path) {
    var n = document.body;
    for (var i = 0; i < path.length && n; i++) n = n.children[path[i]];
    return n;
  }
  function serialize(el, path, budget) {
    if (budget.n-- <= 0) return null;
    var children = [];
    for (var i = 0; i < el.children.length; i++) {
      var c = el.children[i];
      if (c.id === "__ww-overlay" || /^(SCRIPT|STYLE|META|LINK|TITLE)$/.test(c.tagName)) continue;
      var s = serialize(c, path.concat(i), budget);
      if (s) children.push(s);
    }
    var text = "";
    for (var j = 0; j < el.childNodes.length; j++) if (el.childNodes[j].nodeType === 3) text += el.childNodes[j].textContent;
    var attrs = {};
    ["id", "class", "href", "type", "role", "hidden", "aria-label", "aria-expanded", "aria-controls", "aria-invalid", "aria-describedby", "for", "name"].forEach(function (a) { if (el.hasAttribute(a)) attrs[a] = el.getAttribute(a); });
    return { tag: el.tagName.toLowerCase(), attrs: attrs, text: text.trim().slice(0, 40), path: path, children: children };
  }
  window.addEventListener("message", function (e) {
    var d = e.data || {};
    if (d.__webwiz === "inspect-tree") {
      parent.postMessage({ __webwiz: "inspect-tree-result", tree: serialize(document.body, [], { n: 400 }) }, "*");
    } else if (d.__webwiz === "inspect-node") {
      var el = nodeAt(d.path || []);
      if (!el) return;
      var cs = getComputedStyle(el);
      var styles = {};
      (d.props || []).forEach(function (p) { styles[p] = cs.getPropertyValue(p); });
      var r = el.getBoundingClientRect();
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "__ww-overlay";
        overlay.style.cssText = "position:fixed;pointer-events:none;z-index:2147483647;outline:2px solid #7aa2ff;background:rgba(122,162,255,.18);transition:all .1s";
        document.documentElement.appendChild(overlay);
      }
      overlay.style.left = r.left + "px"; overlay.style.top = r.top + "px";
      overlay.style.width = r.width + "px"; overlay.style.height = r.height + "px";
      parent.postMessage({ __webwiz: "inspect-node-result", path: d.path, styles: styles, rect: { x: r.x, y: r.y, width: r.width, height: r.height } }, "*");
    } else if (d.__webwiz === "inspect-clear" && overlay) {
      overlay.remove(); overlay = null;
    }
  });
})();
`;

export type BuildOptions = {
	/** Script extra al final (arnés de tests) */
	harness?: string;
	/** Respuestas simuladas para fetch() */
	network?: NetworkMock[];
	/** Activa el inspector del panel Elementos */
	inspector?: boolean;
	/** Código de axe-core para las auditorías de accesibilidad */
	axeSource?: string;
};

/**
 * Documento completo para el iframe aislado: index.html del reto con
 * styles.css y app.js (con protección de bucles) incrustados.
 */
export function buildDocument(files: ChallengeFiles, options: BuildOptions = {}) {
	const protectedJs = files["app.js"].trim() ? protectLoops(files["app.js"]) : null;
	const userScript = !protectedJs
		? ""
		: protectedJs.ok
			? `<script>${escapeTag(protectedJs.code, "script")}\n//# sourceURL=app.js</script>`
			: `<script>console.error(${JSON.stringify(
					protectedJs.error + (protectedJs.line ? ` (línea ${protectedJs.line})` : ""),
				)});</script>`;

	const network = options.network
		? `<script>window.__WEBWIZ_NETWORK = ${escapeTag(JSON.stringify(options.network), "script")};${NETWORK_BRIDGE}</script>`
		: "";
	const inspector = options.inspector ? `<script>${INSPECTOR_BRIDGE}</script>` : "";
	const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><script>${CONSOLE_BRIDGE}</script>${network}${inspector}<style>${escapeTag(files["styles.css"], "style")}</style>`;
	const axe = options.axeSource ? `<script>${escapeTag(options.axeSource, "script")}</script>` : "";
	const tail = `${userScript}${axe}${options.harness ? `<script>${escapeTag(options.harness, "script")}</script>` : ""}`;

	let html = files["index.html"];
	// Quitar enlaces a los propios archivos: ya van incrustados
	html = html
		.replace(/<link[^>]+href=["']?styles\.css["']?[^>]*>/gi, "")
		.replace(/<script[^>]+src=["']?app\.js["']?[^>]*>\s*<\/script>/gi, "");

	if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, (m) => m + head);
	else html = head + html;

	// Reemplazo con función: en una cadena de reemplazo "$$" o "$&" son especiales
	// (rompía el arnés, que usa $ y $$, en páginas con </body>)
	if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, () => tail + "</body>");
	else html = html + tail;

	return html;
}
