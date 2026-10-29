import { describe, it, expect } from "vitest";
import {
	parseCss,
	parseJsTestCases,
	toLanguage,
	validateCss,
	validateHtml,
} from "../../src/utils/challengeValidation";

describe("validateHtml", () => {
	const expected = "<header>...</header><main>...</main><footer>...</footer>";

	it("acepta una página con las etiquetas pedidas aunque tengan contenido", () => {
		const html = `<!DOCTYPE html><html><body>
			<header class="top"><h1>Hola</h1></header>
			<main><p>Contenido</p></main>
			<footer>© 2026</footer></body></html>`;
		expect(validateHtml(html, expected).ok).toBe(true);
	});

	it("indica qué etiquetas faltan", () => {
		const res = validateHtml("<header>x</header>", expected);
		expect(res.ok).toBe(false);
		expect(res.details).toEqual([
			"Falta la etiqueta <main>",
			"Falta la etiqueta <footer>",
		]);
	});
});

describe("validateCss", () => {
	const expected =
		".container { display: flex; justify-content: center; align-items: center; background-color: blue; }";

	it("acepta CSS equivalente con otro orden, espacios y comentarios", () => {
		const css = `/* mi solución */
			.container{background-color:BLUE;align-items:center;
			display:flex;justify-content:center;padding:1rem}`;
		expect(validateCss(css, expected).ok).toBe(true);
	});

	it("detecta valores incorrectos y declaraciones que faltan", () => {
		const res = validateCss(".container { display: block; }", expected);
		expect(res.ok).toBe(false);
		expect(res.details[0]).toMatch(/"display" debería ser "flex"/);
		expect(res.details).toHaveLength(4);
	});

	it("parseCss ignora !important y agrupa por selector", () => {
		const rules = parseCss("a { color: red !important; } a { margin: 0 }");
		expect(Object.fromEntries(rules.get("a")!)).toEqual({
			color: "red",
			margin: "0",
		});
	});
});

describe("JavaScript", () => {
	it("extrae los casos de prueba 'expresión => valor'", () => {
		expect(
			parseJsTestCases("sumarElementos([1, 2, 3]) => 6\nf(() => 1) => 1")
		).toEqual([
			{ expression: "sumarElementos([1, 2, 3])", expected: "6" },
			{ expression: "f(() => 1)", expected: "1" },
		]);
	});

	it("toLanguage normaliza la categoría", () => {
		expect(toLanguage("JavaScript")).toBe("javascript");
		expect(toLanguage("CSS")).toBe("css");
		expect(toLanguage(undefined)).toBe("html");
	});
});
