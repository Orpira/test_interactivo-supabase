import { describe, it, expect } from "vitest";
import { getWebAuthRedirectUrl } from "../../src/services/authRedirect";

describe("vuelta del login", () => {
	it("vuelve siempre al dominio desde el que se inició (PKCE)", () => {
		expect(getWebAuthRedirectUrl()).toBe(`${window.location.origin}/auth/callback`);
	});
});
