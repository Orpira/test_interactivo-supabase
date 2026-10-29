import { buildDocument } from "./buildDocument";
import { DOM_HARNESS } from "./harness";
import { protectLoops } from "./loopProtect";
import {
	TEST_TIMEOUT_MS,
	type ChallengeFiles,
	type ChallengeTest,
	type TestResult,
} from "./types";

/**
 * Ejecuta los tests de un reto contra los archivos del usuario.
 *  - "dom": en un iframe aislado (sandbox="allow-scripts", sin allow-same-origin).
 *  - "js" y "console": en un Web Worker que se termina si supera el tiempo.
 * Nunca se evalúa código del usuario en la propia app.
 */
export const SANDBOX = "allow-scripts allow-forms allow-modals";

export async function runChallengeTests(
	files: ChallengeFiles,
	tests: ChallengeTest[],
): Promise<TestResult[]> {
	const domTests = tests.filter((t) => t.type === "dom");
	const workerTests = tests.filter((t) => t.type !== "dom");

	const [domResults, workerResults] = await Promise.all([
		domTests.length ? runDomTests(files, domTests) : Promise.resolve([]),
		workerTests.length ? runWorkerTests(files["app.js"], workerTests) : Promise.resolve([]),
	]);

	const byName = new Map([...domResults, ...workerResults].map((r) => [r.name, r]));
	return tests.map(
		(t) => byName.get(t.name) ?? { name: t.name, passed: false, message: "No se ejecutó." },
	);
}

// ------------------------------------------------------------------ DOM

function runDomTests(files: ChallengeFiles, tests: ChallengeTest[]): Promise<TestResult[]> {
	return new Promise((resolve) => {
		const iframe = document.createElement("iframe");
		// Sin allow-same-origin: el código del usuario no accede a la app.
		// allow-forms y allow-modals: retos con formularios y <dialog>.
		iframe.setAttribute("sandbox", SANDBOX);
		iframe.setAttribute("aria-hidden", "true");
		iframe.tabIndex = -1;
		// Invisible pero dentro de la ventana y con tamaño real: los tests miden
		// posiciones, y Chrome congela los iframes que considera fuera de pantalla.
		Object.assign(iframe.style, {
			position: "fixed",
			left: "0",
			top: "0",
			width: "1024px",
			height: "768px",
			border: "0",
			opacity: "0",
			pointerEvents: "none",
			zIndex: "-1",
		});
		const runId = Math.random().toString(36).slice(2);
		let finished = false;

		const finish = (results: TestResult[]) => {
			if (finished) return;
			finished = true;
			clearTimeout(timer);
			window.removeEventListener("message", onMessage);
			iframe.remove();
			resolve(results);
		};

		const onMessage = (event: MessageEvent) => {
			if (event.source !== iframe.contentWindow) return;
			const data = event.data as { __webwiz?: string; runId?: string; results?: TestResult[] };
			if (data?.__webwiz === "harness-ready") {
				iframe.contentWindow?.postMessage(
					{
						__webwiz: "run-dom-tests",
						runId,
						tests: tests.map((t) => ({ name: t.name, code: "code" in t ? t.code : "", message: t.message })),
					},
					"*",
				);
			} else if (data?.__webwiz === "dom-results" && data.runId === runId) {
				finish(data.results ?? []);
			}
		};

		// Margen global por si la página del usuario no llega a cargar
		const timer = setTimeout(
			() =>
				finish(
					tests.map((t) => ({
						name: t.name,
						passed: false,
						message: `Tiempo agotado: la página no respondió en ${TEST_TIMEOUT_MS / 1000} s.`,
					})),
				),
			tests.length * TEST_TIMEOUT_MS + 3000,
		);

		window.addEventListener("message", onMessage);
		iframe.srcdoc = buildDocument(files, { harness: DOM_HARNESS });
		document.body.appendChild(iframe);
	});
}

// ------------------------------------------------------- JS y consola

const WORKER_SOURCE = `
var lines = [];
var fmt = function (a) {
  if (typeof a === "string") return a;
  try { return JSON.stringify(a); } catch (e) { return String(a); }
};
console.log = console.info = console.warn = console.error = function () {
  lines.push(Array.prototype.map.call(arguments, fmt).join(" "));
};
self.alert = self.prompt = self.confirm = function () {};
var eq = function (a, b) { return JSON.stringify(a) === JSON.stringify(b); };
self.onmessage = async function (event) {
  var d = event.data;
  try {
    if (d.type === "console") {
      await new Function(d.code + "\\n;return undefined;")();
      await new Promise(function (r) { setTimeout(r, 20); });
      self.postMessage({ ok: true, output: lines.join("\\n") });
      return;
    }
    var fn = new Function("eq", d.code + "\\n;return (async function () {\\n" + d.test + "\\n})();");
    var out = await fn(eq);
    if (out && typeof out === "object" && "pass" in out) self.postMessage({ ok: true, pass: !!out.pass, message: out.message });
    else self.postMessage({ ok: true, pass: out === true, message: typeof out === "string" ? out : undefined });
  } catch (e) {
    self.postMessage({ ok: false, message: (e && e.name ? e.name + ": " : "") + ((e && e.message) || String(e)) });
  }
};
`;

let workerUrl: string | null = null;
const getWorkerUrl = () =>
	(workerUrl ??= URL.createObjectURL(new Blob([WORKER_SOURCE], { type: "text/javascript" })));

const normalizeOutput = (s: string) =>
	s
		.replace(/\r/g, "")
		.split("\n")
		.map((l) => l.trimEnd())
		.join("\n")
		.trim();

function runInWorker(payload: Record<string, string>): Promise<{
	ok: boolean;
	pass?: boolean;
	message?: string;
	output?: string;
	timeout?: boolean;
}> {
	return new Promise((resolve) => {
		const worker = new Worker(getWorkerUrl());
		const timer = setTimeout(() => {
			worker.terminate();
			resolve({ ok: false, timeout: true });
		}, TEST_TIMEOUT_MS);
		worker.onmessage = (e) => {
			clearTimeout(timer);
			worker.terminate();
			resolve(e.data);
		};
		worker.onerror = (e) => {
			e.preventDefault();
			clearTimeout(timer);
			worker.terminate();
			resolve({ ok: false, message: e.message });
		};
		worker.postMessage(payload);
	});
}

async function runWorkerTests(appJs: string, tests: ChallengeTest[]): Promise<TestResult[]> {
	const protectedJs = protectLoops(appJs);
	if (!protectedJs.ok) {
		const msg = protectedJs.error + (protectedJs.line ? ` (línea ${protectedJs.line})` : "");
		return tests.map((t) => ({ name: t.name, passed: false, message: msg }));
	}

	// Cada test en su propio worker: un bucle infinito solo afecta a ese test
	return Promise.all(
		tests.map(async (t): Promise<TestResult> => {
			const res = await runInWorker(
				t.type === "console"
					? { type: "console", code: protectedJs.code }
					: { type: "js", code: protectedJs.code, test: "code" in t ? t.code : "" },
			);
			if (res.timeout) {
				return {
					name: t.name,
					passed: false,
					message: `Tiempo agotado (${TEST_TIMEOUT_MS / 1000} s): ¿hay un bucle infinito?`,
				};
			}
			if (!res.ok) return { name: t.name, passed: false, message: res.message ?? "Error" };
			if (t.type === "console") {
				const passed = normalizeOutput(res.output ?? "") === normalizeOutput(t.expected);
				return {
					name: t.name,
					passed,
					message: passed
						? "Correcto"
						: t.message ??
							`Se esperaba:\n${t.expected}\nSe obtuvo:\n${res.output || "(nada)"}`,
				};
			}
			return {
				name: t.name,
				passed: !!res.pass,
				message: res.pass ? res.message ?? "Correcto" : res.message ?? t.message ?? "No se cumple",
			};
		}),
	);
}
