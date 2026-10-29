import type { ChallengeFiles } from "./types";
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
    send("error", [(e.error && e.error.name ? e.error.name + ": " : "") + e.message + (e.lineno ? " (línea " + e.lineno + ")" : "")]);
  });
  window.addEventListener("unhandledrejection", function (e) {
    send("error", ["Promesa rechazada: " + (e.reason && e.reason.message ? e.reason.message : String(e.reason))]);
  });
})();
`;

export type BuildOptions = {
	/** Script extra al final (arnés de tests) */
	harness?: string;
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
			? `<script>${escapeTag(protectedJs.code, "script")}</script>`
			: `<script>console.error(${JSON.stringify(
					protectedJs.error + (protectedJs.line ? ` (línea ${protectedJs.line})` : ""),
				)});</script>`;

	const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><script>${CONSOLE_BRIDGE}</script><style>${escapeTag(files["styles.css"], "style")}</style>`;
	const tail = `${userScript}${options.harness ? `<script>${escapeTag(options.harness, "script")}</script>` : ""}`;

	let html = files["index.html"];
	// Quitar enlaces a los propios archivos: ya van incrustados
	html = html
		.replace(/<link[^>]+href=["']?styles\.css["']?[^>]*>/gi, "")
		.replace(/<script[^>]+src=["']?app\.js["']?[^>]*>\s*<\/script>/gi, "");

	if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, (m) => m + head);
	else html = head + html;

	if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, tail + "</body>");
	else html = html + tail;

	return html;
}
