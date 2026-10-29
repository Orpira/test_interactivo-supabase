import { describe, it, expect } from "vitest";
import { toCSV } from "../../src/utils/exportCSV";

describe("toCSV", () => {
	it("escapa comas, comillas y objetos", () => {
		const csv = toCSV([
			{ nombre: 'Ana "la crack"', categoria: "html, css", extra: { a: 1 } },
		]);
		expect(csv).toBe(
			'nombre,categoria,extra\r\n"Ana ""la crack""","html, css","{""a"":1}"'
		);
	});

	it("respeta las columnas indicadas", () => {
		expect(toCSV([{ a: 1, b: 2 }], ["b"])).toBe("b\r\n2");
	});
});
