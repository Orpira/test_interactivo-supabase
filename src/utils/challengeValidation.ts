/**
 * Validación de retos de código (HTML, CSS y JavaScript).
 *
 * El campo `expectedOutput` de cada reto usa un formato distinto según el
 * lenguaje:
 *  - HTML: "<header>...</header><main>...</main>"  → etiquetas requeridas
 *          ("..." significa "cualquier contenido").
 *  - CSS:  ".container { display: flex; ... }"      → declaraciones requeridas
 *          para cada selector.
 *  - JS:   "sumar([1, 2]) => 3"                      → casos de prueba
 *          (uno por línea): expresión => valor esperado.
 */

export type ValidationResult = {
	ok: boolean;
	message: string;
	details: string[];
};

export type ChallengeLanguage = "html" | "css" | "javascript";

export function toLanguage(value?: string | null): ChallengeLanguage {
	const v = value?.toLowerCase();
	if (v === "css") return "css";
	if (v === "javascript" || v === "js") return "javascript";
	return "html";
}

export async function validateChallenge(
	language: ChallengeLanguage,
	userCode: string,
	expectedOutput: string
): Promise<ValidationResult> {
	if (language === "html") return validateHtml(userCode, expectedOutput);
	if (language === "css") return validateCss(userCode, expectedOutput);
	return validateJs(userCode, expectedOutput);
}

// ---------------------------------------------------------------- HTML

export function validateHtml(
	userHtml: string,
	expectedOutput: string
): ValidationResult {
	const requiredTags = Array.from(
		expectedOutput.matchAll(/<([a-zA-Z][\w-]*)\b[^>]*>/g),
		(m) => m[1].toLowerCase()
	);
	const unique = Array.from(new Set(requiredTags));

	const doc = new DOMParser().parseFromString(userHtml, "text/html");
	const missing = unique.filter((tag) => !doc.querySelector(tag));

	return missing.length === 0
		? { ok: true, message: "✅ ¡Estructura HTML correcta!", details: [] }
		: {
				ok: false,
				message: "❌ Faltan elementos en tu HTML.",
				details: missing.map((tag) => `Falta la etiqueta <${tag}>`),
		  };
}

// ----------------------------------------------------------------- CSS

type CssRules = Map<string, Map<string, string>>;

const normalizeSelector = (s: string) =>
	s
		.trim()
		.replace(/\s*([>+~,])\s*/g, "$1")
		.replace(/\s+/g, " ")
		.toLowerCase();

const normalizeValue = (s: string) =>
	s
		.trim()
		.replace(/\s*!important$/i, "")
		.replace(/\s+/g, " ")
		.toLowerCase();

export function parseCss(css: string): CssRules {
	const rules: CssRules = new Map();
	const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
	for (const match of withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
		const selector = normalizeSelector(match[1]);
		const declarations = rules.get(selector) ?? new Map<string, string>();
		for (const decl of match[2].split(";")) {
			const idx = decl.indexOf(":");
			if (idx === -1) continue;
			const prop = decl.slice(0, idx).trim().toLowerCase();
			const value = normalizeValue(decl.slice(idx + 1));
			if (prop && value) declarations.set(prop, value);
		}
		rules.set(selector, declarations);
	}
	return rules;
}

export function validateCss(
	userCss: string,
	expectedOutput: string
): ValidationResult {
	const expected = parseCss(expectedOutput);
	const actual = parseCss(userCss);
	const details: string[] = [];

	for (const [selector, declarations] of expected) {
		const userDecls = actual.get(selector);
		if (!userDecls) {
			details.push(`Falta la regla para "${selector}"`);
			continue;
		}
		for (const [prop, value] of declarations) {
			const got = userDecls.get(prop);
			if (got === undefined) {
				details.push(`${selector}: falta "${prop}: ${value}"`);
			} else if (got !== value) {
				details.push(
					`${selector}: "${prop}" debería ser "${value}" (tienes "${got}")`
				);
			}
		}
	}

	return details.length === 0
		? { ok: true, message: "✅ ¡Estilos correctos!", details: [] }
		: { ok: false, message: "❌ Tus estilos aún no cumplen el reto.", details };
}

// ---------------------------------------------------------- JavaScript

type TestCase = { expression: string; expected: string };

export function parseJsTestCases(expectedOutput: string): TestCase[] {
	return expectedOutput
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => {
			const idx = line.lastIndexOf("=>");
			return idx === -1
				? null
				: {
						expression: line.slice(0, idx).trim(),
						expected: line.slice(idx + 2).trim(),
				  };
		})
		.filter((t): t is TestCase => t !== null && !!t.expression);
}

const JS_TIMEOUT_MS = 2000;

/**
 * Ejecuta el código del usuario en un Web Worker aislado (sin acceso al DOM,
 * a cookies ni a la sesión de la app) y con límite de tiempo, para que un
 * bucle infinito no congele la página.
 */
export function validateJs(
	userCode: string,
	expectedOutput: string
): Promise<ValidationResult> {
	const cases = parseJsTestCases(expectedOutput);
	if (cases.length === 0) {
		return Promise.resolve({
			ok: false,
			message: "Este reto no tiene casos de prueba definidos.",
			details: [],
		});
	}

	const workerSource = `
		self.alert = () => {};
		self.prompt = () => null;
		self.confirm = () => false;
		self.onmessage = (event) => {
			const { code, cases } = event.data;
			const results = cases.map(({ expression, expected }) => {
				try {
					const run = new Function(code + "\\n;return (" + expression + ");");
					const actual = run();
					const want = new Function("return (" + expected + ");")();
					const pass = JSON.stringify(actual) === JSON.stringify(want);
					return { expression, expected, actual: JSON.stringify(actual), pass };
				} catch (error) {
					return { expression, expected, actual: null, pass: false, error: String(error && error.message || error) };
				}
			});
			self.postMessage(results);
		};
	`;

	return new Promise((resolve) => {
		let worker: Worker;
		let url: string;
		try {
			url = URL.createObjectURL(
				new Blob([workerSource], { type: "text/javascript" })
			);
			worker = new Worker(url);
		} catch {
			resolve({
				ok: false,
				message: "Tu navegador no permite ejecutar la validación.",
				details: [],
			});
			return;
		}

		const finish = (result: ValidationResult) => {
			clearTimeout(timer);
			worker.terminate();
			URL.revokeObjectURL(url);
			resolve(result);
		};

		const timer = setTimeout(
			() =>
				finish({
					ok: false,
					message: "⏱️ Tu código tardó demasiado (¿un bucle infinito?).",
					details: [],
				}),
			JS_TIMEOUT_MS
		);

		worker.onmessage = (
			event: MessageEvent<
				{
					expression: string;
					expected: string;
					actual: string | null;
					pass: boolean;
					error?: string;
				}[]
			>
		) => {
			const failed = event.data.filter((r) => !r.pass);
			finish(
				failed.length === 0
					? {
							ok: true,
							message: `✅ ¡Todas las pruebas pasan! (${event.data.length}/${event.data.length})`,
							details: [],
					  }
					: {
							ok: false,
							message: `❌ ${failed.length} de ${event.data.length} pruebas fallan.`,
							details: failed.map((r) =>
								r.error
									? `${r.expression} → error: ${r.error}`
									: `${r.expression} → esperado ${r.expected}, obtenido ${
											r.actual ?? "undefined"
									  }`
							),
					  }
			);
		};

		worker.onerror = (event) => {
			event.preventDefault();
			finish({
				ok: false,
				message: "❌ Tu código tiene un error.",
				details: [event.message],
			});
		};

		worker.postMessage({ code: userCode, cases });
	});
}
