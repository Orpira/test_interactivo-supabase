import { describe, it, expect } from "vitest";
import { GIT_SCENARIOS } from "../../src/content/topics/git";
import { emptyRepo, run, seedCommit, tokenize } from "../../src/features/git/minigit";

describe("mini-git", () => {
	it("tokenize respeta comillas", () => {
		expect(tokenize('git commit -m "Hola mundo" --amend')).toEqual(["git", "commit", "-m", "Hola mundo", "--amend"]);
	});

	it("flujo básico: add, commit, log, status", () => {
		const r = emptyRepo();
		seedCommit(r, "Inicio", { a: "1" });
		run(r, 'echo "2" > a');
		expect(run(r, "git status").output).toContain("modificado: a");
		run(r, "git add a");
		run(r, 'git commit -m "Cambia a"');
		expect(run(r, "git log --oneline").output.split("\n")).toHaveLength(2);
		expect(run(r, "git status").output).toContain("limpio");
	});

	it("errores con mensaje y sin romper", () => {
		const r = emptyRepo();
		seedCommit(r, "Inicio", { a: "1" });
		expect(run(r, "git checkout nada")).toMatchObject({ error: true });
		expect(run(r, "git rebase main").output).toContain("no es un comando");
		expect(run(r, "npm install")).toMatchObject({ error: true });
	});

	it("push sin --force se rechaza si reescribes historia publicada", () => {
		const r = emptyRepo();
		seedCommit(r, "A", { a: "1" });
		seedCommit(r, "B", { a: "2" });
		run(r, "git push");
		run(r, "git reset --hard HEAD~1");
		expect(run(r, "git push")).toMatchObject({ error: true });
	});
});

describe("escenarios de Git", () => {
	it("10 escenarios", () => expect(GIT_SCENARIOS).toHaveLength(10));

	it.each(GIT_SCENARIOS.map((s) => [s.id, s] as const))("%s: sin hacer nada no está resuelto; la solución lo resuelve", (_, s) => {
		const r = s.setup();
		expect(s.check(r)).not.toBe(true);
		for (const cmd of s.solution) {
			const out = run(r, cmd);
			expect(out.error, `${cmd} → ${out.output}`).toBeFalsy();
		}
		expect(s.check(r)).toBe(true);
	});

	it("git-01: hacer revert no vale (main debe volver a origin/main)", () => {
		const s = GIT_SCENARIOS[0];
		const r = s.setup();
		run(r, "git branch carrito");
		run(r, "git revert HEAD");
		run(r, "git switch carrito");
		expect(s.check(r)).toMatch(/main/);
	});

	it("git-04: reset + push --force reescribe la historia y no cuenta", () => {
		const s = GIT_SCENARIOS[3];
		const r = s.setup();
		run(r, "git reset --hard HEAD~1");
		run(r, "git push --force");
		expect(s.check(r)).toMatch(/reescrito/);
	});
});
