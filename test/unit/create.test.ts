import { describe, it, expect } from "vitest";
import { validateDraft } from "../../src/features/create/validate";
import { CHALLENGE_TEMPLATE, INCIDENT_TEMPLATE } from "../../src/features/create/templates";
import { INCIDENTS } from "../../src/content/incidents";
import { topicChallenges } from "../../src/content/topics";

describe("/crear: validación estructural", () => {
	it("las plantillas son válidas", () => {
		expect(validateDraft(CHALLENGE_TEMPLATE, "challenge").ok).toBe(true);
		expect(validateDraft(INCIDENT_TEMPLATE, "incident").ok).toBe(true);
	});

	it("el contenido del repo también pasa la validación", () => {
		for (const c of topicChallenges) expect(validateDraft(JSON.stringify(c), "challenge"), c.id).toMatchObject({ ok: true });
		for (const i of INCIDENTS) expect(validateDraft(JSON.stringify(i), "incident"), i.id).toMatchObject({ ok: true });
	});

	it("detecta errores típicos", () => {
		const bad = JSON.parse(CHALLENGE_TEMPLATE);
		bad.id = "Mi Reto";
		bad.solution = { "app.js": "x" };
		bad.tests.push({ name: bad.tests[0].name, type: "dom", code: "return true" });
		const r = validateDraft(JSON.stringify(bad), "challenge");
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.errors.join("\n")).toMatch(/"id"/);
			expect(r.errors.join("\n")).toMatch(/no es editable/);
			expect(r.errors.join("\n")).toMatch(/nombre repetido/);
		}
		expect(validateDraft("{ no es json", "challenge")).toMatchObject({ ok: false });
	});
});
