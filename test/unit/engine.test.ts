import { describe, it, expect } from "vitest";
import { protectLoops } from "../../src/features/challenges/engine/loopProtect";
import { buildDocument } from "../../src/features/challenges/engine/buildDocument";

describe("protectLoops", () => {
	it("inserta la comprobación en cada tipo de bucle", () => {
		const r = protectLoops("for(;;){} while(x) y(); do {} while(0); for (const a of b) {}");
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.code.match(/__wwLoop\(\d+\)/g)).toHaveLength(4);
	});

	it("convierte un while(true) en un error en lugar de colgarse", () => {
		const r = protectLoops("while (true) {}");
		expect(r.ok).toBe(true);
		if (r.ok) expect(() => new Function(r.code)()).toThrow(/bucle infinito/);
	});

	it("informa de errores de sintaxis con su línea", () => {
		const r = protectLoops("const a = 1;\nfunction (");
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.line).toBe(2);
	});
});

describe("buildDocument", () => {
	it("incrusta CSS y JS y quita los enlaces a los archivos", () => {
		const html = buildDocument({
			"index.html": '<html><head><link rel="stylesheet" href="styles.css"></head><body><p>x</p><script src="app.js"></script></body></html>',
			"styles.css": "p{color:red}",
			"app.js": "console.log(1)",
		});
		expect(html).toContain("<style>p{color:red}</style>");
		expect(html).not.toContain('href="styles.css"');
		expect(html).not.toContain('src="app.js"');
		expect(html).toMatch(/__wwLoop[\s\S]*console\.log\(1\)/);
	});

	it("el código no puede cerrar su etiqueta <script>", () => {
		const html = buildDocument({ "index.html": "", "styles.css": "", "app.js": 'const s = "</script><img src=x>";' });
		expect(html).not.toContain('"</script><img');
	});
});

import { buildDocument } from "../../src/features/challenges/engine/buildDocument";
describe("buildDocument", () => {
	it("no corrompe los $ del arnés en páginas con </body>", () => {
		const doc = buildDocument({ "index.html": "<body><p>x</p></body>", "styles.css": "", "app.js": "" }, { harness: 'var a = "$$"; var b = "$&";' });
		expect(doc).toContain('var a = "$$"; var b = "$&";');
	});
});
