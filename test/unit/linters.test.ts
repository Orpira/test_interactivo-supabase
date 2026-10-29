import { describe, it, expect } from "vitest";
import { lintCss, lintHtml, lintJs } from "../../src/features/editor/linters";

const lineOf = (code: string, pos: number) => code.slice(0, pos).split("\n").length;

describe("linters del editor", () => {
	it("JS: marca el error de sintaxis en su línea", () => {
		const code = "const a = 1;\nconst b = ;\nconsole.log(a);";
		const [issue] = lintJs(code);
		expect(lineOf(code, issue.from)).toBe(2);
		expect(issue.message).toMatch(/Error de sintaxis/);
		expect(lintJs("const ok = () => 1;")).toEqual([]);
	});

	it("CSS: llaves sin cerrar y declaraciones sin dos puntos", () => {
		const code = ".a {\n  color red;\n}\n.b {\n  margin: 0;\n";
		const issues = lintCss(code);
		expect(issues.map((i) => lineOf(code, i.from))).toEqual([2, 4]);
		expect(lintCss(".a { color: red; } @media (max-width: 600px) { .a { color: blue; } }")).toEqual([]);
	});

	it("HTML: etiquetas sin cerrar o cruzadas", () => {
		const code = "<main>\n  <section>\n    <p>Hola\n  </main>\n<div>";
		const issues = lintHtml(code);
		const lines = issues.map((i) => lineOf(code, i.from));
		expect(lines).toContain(2); // <section> no cerrada antes de </main>
		expect(lines).toContain(5); // <div> sin cerrar
		expect(lines).not.toContain(3); // <p> se cierra sola
		expect(lintHtml('<img src="a.png" alt="x"><br><input value="a>b"><script>if (a < b) {}</script>')).toEqual([]);
	});
});
