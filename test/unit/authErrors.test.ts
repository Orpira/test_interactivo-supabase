import { describe, it, expect } from "vitest";
import { translateAuthError } from "../../src/services/authErrors";

describe("translateAuthError", () => {
	it("usa el código de error si existe", () => {
		expect(translateAuthError({ code: "email_not_confirmed" })).toMatch(
			/confirmado/
		);
	});
	it("reconoce mensajes en inglés sin código", () => {
		expect(translateAuthError({ message: "User already registered" })).toMatch(
			/ya tiene una cuenta/
		);
	});
	it("devuelve el mensaje original o uno genérico", () => {
		expect(translateAuthError({ message: "Algo raro" })).toBe("Algo raro");
		expect(translateAuthError(null)).toMatch(/Inténtalo de nuevo/);
	});
});
