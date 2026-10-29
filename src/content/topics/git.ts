import { currentBranch, emptyRepo, firstParentLog, headCommitId, headTree, seedCommit, type Repo } from "@/features/git/minigit";

/**
 * Git en escenarios: arreglar situaciones reales con un terminal simulado.
 * `check` devuelve true o el motivo por el que aún no está resuelto.
 */
export type GitScenario = {
	id: string;
	title: string;
	difficulty: "junior" | "semi_senior" | "senior";
	concepts: string[];
	instructions: string;
	setup: () => Repo;
	check: (r: Repo) => true | string;
	hints: string[];
	solution: string[];
};

const messages = (r: Repo, branch?: string) =>
	firstParentLog(r, branch ? (r.branches[branch] ?? null) : headCommitId(r)).map((c) => c.message);
const clean = (r: Repo) => {
	const h = headTree(r);
	const same = (a: Record<string, string>, b: Record<string, string>) =>
		Object.keys({ ...a, ...b }).every((k) => a[k] === b[k]);
	return same(h, r.index) && same(h, r.work);
};

function base(): Repo {
	const r = emptyRepo();
	seedCommit(r, "Primer commit", { "README.md": "# Tienda" });
	seedCommit(r, "Añade la portada", { "index.html": "<h1>Tienda</h1>" });
	r.remote["origin/main"] = r.branches.main;
	return r;
}

export const GIT_SCENARIOS: GitScenario[] = [
	{
		id: "git-01",
		title: "Commit en main por error",
		difficulty: "semi_senior",
		concepts: ["git-ramas", "git-deshacer"],
		instructions:
			"Hiciste el commit «Añade el carrito» directamente en main (aún sin push). Llévalo a una rama nueva llamada carrito y deja main como está en origin/main. Termina en la rama carrito.",
		setup: () => {
			const r = base();
			seedCommit(r, "Añade el carrito", { "carrito.js": "export const carrito = [];" });
			return r;
		},
		check: (r) => {
			if (r.branches.main !== r.remote["origin/main"]) return "main todavía no coincide con origin/main";
			if (!r.branches.carrito) return "No existe la rama carrito";
			if (messages(r, "carrito")[0] !== "Añade el carrito") return "El commit «Añade el carrito» no está en la rama carrito";
			if (currentBranch(r) !== "carrito") return "Termina en la rama carrito";
			return true;
		},
		hints: ["Crea la rama donde estás ahora: git branch carrito", "Mueve main un commit atrás: git reset --hard HEAD~1", "git switch carrito"],
		solution: ["git branch carrito", "git reset --hard HEAD~1", "git switch carrito"],
	},
	{
		id: "git-02",
		title: "Errata en el último mensaje",
		difficulty: "junior",
		concepts: ["git-commits"],
		instructions: "El último commit (sin publicar) dice «Añade el formualrio». Corrige el mensaje a «Añade el formulario» sin crear un commit nuevo encima.",
		setup: () => {
			const r = base();
			seedCommit(r, "Añade el formualrio", { "form.html": "<form></form>" });
			return r;
		},
		check: (r) => {
			const log = messages(r);
			if (log[0] !== "Añade el formulario") return `El último mensaje es «${log[0]}»`;
			if (log.length !== 3) return "La historia debe seguir teniendo 3 commits";
			return true;
		},
		hints: ['git commit --amend -m "Añade el formulario"'],
		solution: ['git commit --amend -m "Añade el formulario"'],
	},
	{
		id: "git-03",
		title: "Un secreto en el staging",
		difficulty: "junior",
		concepts: ["git-commits"],
		instructions:
			"Hiciste git add . y se coló .env (con claves). Haz commit solo de estilos.css con el mensaje «Añade estilos» y deja .env sin seguimiento (no lo borres).",
		setup: () => {
			const r = base();
			r.work["estilos.css"] = "body { margin: 0; }";
			r.work[".env"] = "STRIPE_KEY=sk_live_123";
			r.index["estilos.css"] = r.work["estilos.css"];
			r.index[".env"] = r.work[".env"];
			return r;
		},
		check: (r) => {
			const h = headTree(r);
			if (h[".env"] !== undefined) return ".env está en un commit: ¡las claves quedarían en la historia!";
			if (messages(r)[0] !== "Añade estilos" || h["estilos.css"] === undefined) return "Falta el commit «Añade estilos» con estilos.css";
			if (r.work[".env"] === undefined) return "No borres .env: solo hay que sacarlo del staging";
			if (r.index[".env"] !== undefined) return ".env sigue en el staging";
			return true;
		},
		hints: ["git restore --staged .env (o git reset .env)", 'git commit -m "Añade estilos"'],
		solution: ["git restore --staged .env", 'git commit -m "Añade estilos"'],
	},
	{
		id: "git-04",
		title: "Deshacer un commit ya publicado",
		difficulty: "semi_senior",
		concepts: ["git-deshacer"],
		instructions:
			"El commit «Cambia el precio a 0 €» ya está en origin/main y tus compañeros lo tienen. Deshaz su efecto sin reescribir la historia y publícalo con git push (sin --force).",
		setup: () => {
			const r = base();
			seedCommit(r, "Cambia el precio a 0 €", { "precio.json": '{ "precio": 0 }' });
			r.remote["origin/main"] = r.branches.main;
			return r;
		},
		check: (r) => {
			const log = messages(r);
			if (!log.includes("Cambia el precio a 0 €")) return "Has reescrito la historia publicada: el commit original debe seguir en ella";
			if (headTree(r)["precio.json"] !== undefined) return "El cambio de precio sigue aplicado";
			if (r.remote["origin/main"] !== r.branches.main) return "Falta publicar con git push";
			return true;
		},
		hints: ["git revert crea un commit nuevo que deshace otro.", "git revert HEAD y después git push"],
		solution: ["git revert HEAD", "git push"],
	},
	{
		id: "git-05",
		title: "Urgencia con trabajo a medias",
		difficulty: "semi_senior",
		concepts: ["git-ramas"],
		instructions:
			"Estás en la rama buscador con cambios sin commit en buscador.js. Hay que arreglar ya una errata en main: guarda tus cambios, cambia a main, corrige index.html a «<h1>Tienda Norte</h1>» con commit «Corrige el título», vuelve a buscador y recupera tus cambios.",
		setup: () => {
			const r = base();
			r.branches.buscador = r.branches.main;
			r.head = { branch: "buscador" };
			seedCommit(r, "Esqueleto del buscador", { "buscador.js": "// TODO" });
			r.work["buscador.js"] = "export function buscar(q) { return q.trim(); }";
			r.work["index.html"] = "<h1>Tienda</h1>\n<input id=q>";
			return r;
		},
		check: (r) => {
			if (headTree({ ...r, head: { branch: "main" } })["index.html"] !== "<h1>Tienda Norte</h1>") return "main no tiene el título corregido";
			if (messages(r, "main")[0] !== "Corrige el título") return "Falta el commit «Corrige el título» en main";
			if (currentBranch(r) !== "buscador") return "Vuelve a la rama buscador";
			if (r.work["buscador.js"] !== "export function buscar(q) { return q.trim(); }") return "No has recuperado tus cambios de buscador.js";
			if (r.stash.length) return "Quedan cambios en el stash";
			return true;
		},
		hints: ["git stash guarda los cambios y limpia el árbol.", "En main: echo \"<h1>Tienda Norte</h1>\" > index.html, git add, git commit.", "De vuelta en buscador: git stash pop"],
		solution: ["git stash", "git switch main", 'echo "<h1>Tienda Norte</h1>" > index.html', "git add index.html", 'git commit -m "Corrige el título"', "git switch buscador", "git stash pop"],
	},
	{
		id: "git-06",
		title: "Traer un solo commit de otra rama",
		difficulty: "senior",
		concepts: ["git-ramas"],
		instructions:
			"La rama experimentos tiene varios commits a medias, pero uno, «Arregla el cálculo del IVA», hace falta ya en main. Llévalo a main sin traer los demás.",
		setup: () => {
			const r = base();
			r.branches.experimentos = r.branches.main;
			r.head = { branch: "experimentos" };
			seedCommit(r, "Prueba de diseño oscuro", { "tema.css": "body { background: #000; }" });
			seedCommit(r, "Arregla el cálculo del IVA", { "iva.js": "export const iva = (x) => x * 1.21;" });
			seedCommit(r, "Experimento con animaciones", { "anim.css": "* { transition: all 1s; }" });
			r.head = { branch: "main" };
			r.index = { ...headTree(r) };
			r.work = { ...headTree(r) };
			return r;
		},
		check: (r) => {
			const main = headTree({ ...r, head: { branch: "main" } });
			if (main["iva.js"] !== "export const iva = (x) => x * 1.21;") return "main no tiene el arreglo del IVA";
			if (main["tema.css"] !== undefined || main["anim.css"] !== undefined) return "Has traído también commits experimentales";
			return true;
		},
		hints: ["git log --oneline --all para ver el id del commit.", "git cherry-pick <id>"],
		solution: ["git cherry-pick experimentos~1"],
	},
	{
		id: "git-07",
		title: "Rama de funcionalidad y fusión",
		difficulty: "junior",
		concepts: ["git-ramas"],
		instructions:
			"Crea la rama contacto, añade contacto.html con el texto «Escríbenos» en un commit «Añade contacto», vuelve a main y fusiónala. Al final borra la rama contacto (ya fusionada).",
		setup: base,
		check: (r) => {
			if (headTree({ ...r, head: { branch: "main" } })["contacto.html"] !== "Escríbenos") return "main no tiene contacto.html con «Escríbenos»";
			if (!messages(r, "main").includes("Añade contacto")) return "Falta el commit «Añade contacto» en main";
			if (r.branches.contacto) return "Borra la rama contacto";
			if (currentBranch(r) !== "main") return "Termina en main";
			return true;
		},
		hints: ["git switch -c contacto", 'echo "Escríbenos" > contacto.html, git add, git commit', "git switch main, git merge contacto, git branch -d contacto"],
		solution: ["git switch -c contacto", 'echo "Escríbenos" > contacto.html', "git add contacto.html", 'git commit -m "Añade contacto"', "git switch main", "git merge contacto", "git branch -d contacto"],
	},
	{
		id: "git-08",
		title: "Borraste un archivo sin querer",
		difficulty: "junior",
		concepts: ["git-deshacer"],
		instructions: "Has borrado index.html y modificado README.md sin hacer commit. Recupera index.html tal como estaba, pero conserva tus cambios en README.md.",
		setup: () => {
			const r = base();
			delete r.work["index.html"];
			r.work["README.md"] = "# Tienda\n\nInstrucciones de instalación";
			return r;
		},
		check: (r) => {
			if (r.work["index.html"] !== "<h1>Tienda</h1>") return "index.html no se ha recuperado";
			if (r.work["README.md"] !== "# Tienda\n\nInstrucciones de instalación") return "Has perdido tus cambios en README.md";
			return true;
		},
		hints: ["git restore index.html recupera solo ese archivo.", "Cuidado: git reset --hard también borraría tus cambios del README."],
		solution: ["git restore index.html"],
	},
	{
		id: "git-09",
		title: "Separar un commit en dos",
		difficulty: "senior",
		concepts: ["git-commits", "git-deshacer"],
		instructions:
			"El último commit «Cambios varios» (sin publicar) mezcla una corrección (login.js) y una funcionalidad (perfil.js). Sustitúyelo por dos commits: «Corrige el login» con login.js y «Añade el perfil» con perfil.js, en ese orden.",
		setup: () => {
			const r = base();
			seedCommit(r, "Cambios varios", { "login.js": "login();", "perfil.js": "perfil();" });
			return r;
		},
		check: (r) => {
			const log = firstParentLog(r, headCommitId(r));
			if (log.some((c) => c.message === "Cambios varios")) return "El commit «Cambios varios» sigue en la historia";
			const [perfil, login] = log;
			if (perfil?.message !== "Añade el perfil" || login?.message !== "Corrige el login") return "Los dos últimos commits deben ser «Corrige el login» y después «Añade el perfil»";
			if (login.tree["perfil.js"] !== undefined || login.tree["login.js"] === undefined) return "«Corrige el login» debe incluir solo login.js";
			if (perfil.tree["perfil.js"] === undefined) return "«Añade el perfil» debe incluir perfil.js";
			if (!clean(r)) return "Quedan cambios sin commit";
			return true;
		},
		hints: ["git reset HEAD~1 deshace el commit pero conserva los cambios en el árbol.", "Luego add + commit de cada archivo por separado."],
		solution: ["git reset HEAD~1", "git add login.js", 'git commit -m "Corrige el login"', "git add perfil.js", 'git commit -m "Añade el perfil"'],
	},
	{
		id: "git-10",
		title: "Trabajo empezado en la rama equivocada",
		difficulty: "semi_senior",
		concepts: ["git-ramas"],
		instructions:
			"Empezaste el pago en main sin hacer commit (pago.js nuevo y preparado). Llévate esos cambios a una rama nueva pago, haz commit «Añade el pago» allí y deja main sin cambios.",
		setup: () => {
			const r = base();
			r.work["pago.js"] = "export function pagar() {}";
			r.index["pago.js"] = r.work["pago.js"];
			return r;
		},
		check: (r) => {
			if (r.branches.main !== r.remote["origin/main"]) return "main no debe tener commits nuevos";
			if (!r.branches.pago || messages(r, "pago")[0] !== "Añade el pago") return "Falta el commit «Añade el pago» en la rama pago";
			if (headTree({ ...r, head: { branch: "pago" } })["pago.js"] === undefined) return "pago.js no está en la rama pago";
			if (!clean(r)) return "Quedan cambios sin commit";
			return true;
		},
		hints: ["git switch -c pago se lleva los cambios sin commit a la rama nueva.", 'git commit -m "Añade el pago"'],
		solution: ["git switch -c pago", 'git commit -m "Añade el pago"'],
	},
];
