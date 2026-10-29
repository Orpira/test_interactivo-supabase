/**
 * Git en miniatura, en memoria y determinista, para los escenarios del
 * laboratorio. Implementa el subconjunto de comandos que necesitan los
 * ejercicios (commit, ramas, reset, revert, cherry-pick, merge, stash, push…)
 * con mensajes en español al estilo de Git.
 */
export type Tree = Record<string, string>;
export type Commit = { id: string; message: string; parents: string[]; tree: Tree };
export type Repo = {
	commits: Record<string, Commit>;
	branches: Record<string, string>;
	head: { branch: string } | { detached: string };
	index: Tree;
	work: Tree;
	/** Ramas publicadas: "origin/main" → commit */
	remote: Record<string, string>;
	stash: { work: Tree; index: Tree; message: string }[];
	/** Commits creados (para ids deterministas) */
	seq: number;
};

export type CmdResult = { output: string; error?: boolean };

class GitError extends Error {}
const fail = (msg: string): never => {
	throw new GitError(msg);
};

// ------------------------------------------------------------ utilidades

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
/** Escribe o borra (si value es undefined) una ruta del árbol. */
function put(tree: Tree, path: string, value: string | undefined) {
	if (value === undefined) delete tree[path];
	else tree[path] = value;
}
const sameTree = (a: Tree, b: Tree) => {
	const ka = Object.keys(a);
	return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k]);
};

function makeId(seq: number, message: string) {
	let h = 2166136261 ^ seq;
	for (const ch of `${seq}:${message}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
	return ((h >>> 0).toString(16).padStart(8, "0") + (seq * 2654435761).toString(16)).slice(0, 7);
}

export function emptyRepo(): Repo {
	return { commits: {}, branches: {}, head: { branch: "main" }, index: {}, work: {}, remote: {}, stash: [], seq: 0 };
}

export const headCommitId = (r: Repo): string | null => ("branch" in r.head ? (r.branches[r.head.branch] ?? null) : r.head.detached);
export const headTree = (r: Repo): Tree => {
	const id = headCommitId(r);
	return id ? r.commits[id].tree : {};
};
export const currentBranch = (r: Repo) => ("branch" in r.head ? r.head.branch : null);

function newCommit(r: Repo, message: string, tree: Tree, parents: string[]): string {
	r.seq += 1;
	const id = makeId(r.seq, message);
	r.commits[id] = { id, message, parents, tree: clone(tree) };
	return id;
}

function moveHead(r: Repo, id: string) {
	if ("branch" in r.head) r.branches[r.head.branch] = id;
	else r.head = { detached: id };
}

/** API para preparar escenarios: commit directo con el contenido indicado. */
export function seedCommit(r: Repo, message: string, files: Tree, remove: string[] = []): string {
	const tree = { ...headTree(r), ...files };
	for (const f of remove) delete tree[f];
	const parent = headCommitId(r);
	const id = newCommit(r, message, tree, parent ? [parent] : []);
	moveHead(r, id);
	r.index = clone(tree);
	r.work = clone(tree);
	return id;
}

export function ancestors(r: Repo, id: string | null): string[] {
	const out: string[] = [];
	const seen = new Set<string>();
	const stack = id ? [id] : [];
	while (stack.length) {
		const c = stack.shift() as string;
		if (seen.has(c)) continue;
		seen.add(c);
		out.push(c);
		stack.push(...r.commits[c].parents);
	}
	return out;
}

/** Historia lineal desde un commit (primer padre), más reciente primero. */
export function firstParentLog(r: Repo, id: string | null): Commit[] {
	const out: Commit[] = [];
	let c = id;
	while (c) {
		out.push(r.commits[c]);
		c = r.commits[c].parents[0] ?? null;
	}
	return out;
}

export function resolve(r: Repo, ref: string): string {
	const m = /^(.+?)((?:~\d*|\^)*)$/.exec(ref);
	if (!m) fail(`fatal: referencia no válida: ${ref}`);
	const [, base, suffix] = m as RegExpExecArray;
	let id: string | null = null;
	if (base === "HEAD") id = headCommitId(r);
	else if (r.branches[base]) id = r.branches[base];
	else if (r.remote[base]) id = r.remote[base];
	else if (/^[0-9a-f]{4,}$/.test(base)) {
		const hits = Object.keys(r.commits).filter((c) => c.startsWith(base));
		if (hits.length === 1) id = hits[0];
	}
	if (!id) fail(`fatal: argumento ambiguo '${ref}': revisión desconocida`);
	for (const step of suffix.match(/~\d*|\^/g) ?? []) {
		const n = step === "^" ? 1 : step === "~" ? 1 : Number(step.slice(1));
		for (let i = 0; i < n; i++) {
			const p: string | undefined = r.commits[id as string].parents[0];
			if (!p) fail(`fatal: '${ref}' no existe (no hay tantos commits)`);
			id = p as string;
		}
	}
	return id as string;
}

function diffPaths(a: Tree, b: Tree): string[] {
	return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => a[k] !== b[k]).sort();
}

/** Aplica los cambios de `from`→`to` sobre `base`; lanza si hay conflicto. */
function applyPatch(base: Tree, from: Tree, to: Tree, what: string): Tree {
	const out = { ...base };
	for (const p of diffPaths(from, to)) {
		if (base[p] !== from[p] && base[p] !== to[p]) fail(`error: no se pudo aplicar ${what}: conflicto en ${p}\nResuelve el conflicto o elige otro camino.`);
		if (to[p] === undefined) delete out[p];
		else out[p] = to[p];
	}
	return out;
}

function localChanges(r: Repo): string[] {
	const h = headTree(r);
	return [...new Set([...diffPaths(h, r.index), ...diffPaths(h, r.work)])];
}

function checkoutTree(r: Repo, targetId: string) {
	const h = headTree(r);
	const target = r.commits[targetId].tree;
	const dirty = localChanges(r);
	const clash = dirty.filter((p) => h[p] !== target[p]);
	if (clash.length) fail(`error: tus cambios locales en ${clash.join(", ")} se sobrescribirían al cambiar de rama.\nHaz commit o guárdalos con git stash antes.`);
	// Los cambios locales se mantienen (como en Git)
	const index = { ...target };
	const work = { ...target };
	for (const p of diffPaths(h, r.index)) put(index, p, r.index[p]);
	for (const p of diffPaths(h, r.work)) put(work, p, r.work[p]);
	r.index = index;
	r.work = work;
}

// ------------------------------------------------------------ comandos

export function tokenize(line: string): string[] {
	const out: string[] = [];
	const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(line))) out.push(m[1] ?? m[2] ?? m[3]);
	return out;
}

const HELP = `Comandos disponibles:
  git status | add <archivo|.> | commit -m "msg" [--amend] [-a] | log [--oneline] [--all]
  git branch [nombre|-d nombre|-m nuevo] | switch [-c] rama | checkout [-b] rama
  git reset [--soft|--mixed|--hard] <ref> | restore [--staged] <archivo>
  git revert <ref> | cherry-pick <ref> | merge <rama> | stash [pop|list] | push [--force]
  git show <ref> | diff
  ls | cat <archivo> | echo "texto" > archivo | echo "texto" >> archivo | rm <archivo> | clear`;

export function run(repo: Repo, line: string): CmdResult {
	const args = tokenize(line.trim());
	if (args.length === 0) return { output: "" };
	try {
		return { output: exec(repo, args, line) };
	} catch (e) {
		if (e instanceof GitError) return { output: e.message, error: true };
		throw e;
	}
}

function exec(r: Repo, args: string[], line: string): string {
	const [cmd, sub, ...rest] = args;
	if (cmd === "help") return HELP;
	if (cmd === "ls") return Object.keys(r.work).sort().join("\n");
	if (cmd === "cat") return sub && r.work[sub] !== undefined ? r.work[sub] : fail(`cat: ${sub ?? ""}: No existe el archivo`);
	if (cmd === "rm") {
		if (!sub || r.work[sub] === undefined) fail(`rm: ${sub ?? ""}: No existe el archivo`);
		delete r.work[sub as string];
		return "";
	}
	if (cmd === "echo") {
		const m = /^echo\s+(?:"([^"]*)"|'([^']*)'|(\S+))\s*(>>?)\s*(\S+)\s*$/.exec(line.trim());
		if (!m) return args.slice(1).join(" ");
		const text = m[1] ?? m[2] ?? m[3];
		const file = m[5];
		r.work[file] = m[4] === ">>" && r.work[file] !== undefined ? `${r.work[file]}\n${text}` : text;
		return "";
	}
	if (cmd !== "git") fail(`${cmd}: orden no encontrada. Escribe help para ver los comandos.`);
	const opts = new Set(rest.filter((a) => a.startsWith("-")));
	const pos = rest.filter((a, i) => !a.startsWith("-") && !(rest[i - 1] === "-m"));
	const msgIdx = rest.indexOf("-m");
	const message = msgIdx >= 0 ? rest[msgIdx + 1] : undefined;

	switch (sub) {
		case "status": {
			const h = headTree(r);
			const staged = diffPaths(h, r.index);
			const unstaged = diffPaths(r.index, r.work).filter((p) => r.index[p] !== undefined || h[p] !== undefined);
			const untracked = Object.keys(r.work).filter((p) => r.index[p] === undefined && h[p] === undefined);
			const where = currentBranch(r) ? `En la rama ${currentBranch(r)}` : `HEAD desacoplada en ${headCommitId(r)}`;
			const lines = [where];
			const tag = (p: string, a: Tree, b: Tree) => (a[p] === undefined ? "nuevo:      " : b[p] === undefined ? "borrado:    " : "modificado: ");
			if (staged.length) lines.push("Cambios a confirmar:", ...staged.map((p) => `  ${tag(p, h, r.index)}${p}`));
			if (unstaged.length) lines.push("Cambios sin preparar:", ...unstaged.map((p) => `  ${tag(p, r.index, r.work)}${p}`));
			if (untracked.length) lines.push("Archivos sin seguimiento:", ...untracked.map((p) => `  ${p}`));
			if (!staged.length && !unstaged.length && !untracked.length) lines.push("nada para hacer commit, el árbol de trabajo está limpio");
			return lines.join("\n");
		}
		case "add": {
			if (!pos.length && !opts.has("-A")) fail("Nada especificado, nada agregado. ¿Quisiste decir git add .?");
			const paths = opts.has("-A") || pos.includes(".") ? [...new Set([...Object.keys(r.work), ...Object.keys(r.index)])] : pos;
			for (const p of paths) {
				if (r.work[p] === undefined && r.index[p] === undefined) fail(`fatal: la ruta '${p}' no coincide con ningún archivo`);
				if (r.work[p] === undefined) delete r.index[p];
				else r.index[p] = r.work[p];
			}
			return "";
		}
		case "rm": {
			if (!opts.has("--cached")) fail("Usa git rm --cached <archivo> para dejar de seguir un archivo sin borrarlo.");
			for (const p of pos) delete r.index[p];
			return pos.map((p) => `rm '${p}'`).join("\n");
		}
		case "restore": {
			if (!pos.length) fail("fatal: debes indicar al menos un archivo");
			const h = headTree(r);
			for (const p of pos) {
				if (opts.has("--staged")) {
					if (h[p] === undefined) delete r.index[p];
					else r.index[p] = h[p];
				} else {
					if (r.index[p] === undefined) fail(`error: '${p}' no coincide con ningún archivo conocido por git`);
					r.work[p] = r.index[p];
				}
			}
			return "";
		}
		case "commit": {
			if (opts.has("-a") || opts.has("-am")) for (const p of Object.keys(r.index)) put(r.index, p, r.work[p]);
			const msg = message ?? (opts.has("-am") ? rest[rest.indexOf("-am") + 1] : undefined);
			const parentId = headCommitId(r);
			if (opts.has("--amend")) {
				if (!parentId) fail("fatal: no hay ningún commit que enmendar");
				const old = r.commits[parentId as string];
				const id = newCommit(r, msg ?? old.message, r.index, old.parents);
				moveHead(r, id);
				return `[${currentBranch(r) ?? "HEAD"} ${id}] ${msg ?? old.message}`;
			}
			if (!msg) fail('error: falta el mensaje. Usa git commit -m "mensaje"');
			if (parentId && sameTree(r.commits[parentId].tree, r.index)) fail("nada para hacer commit (usa git add para preparar cambios)");
			const id = newCommit(r, msg as string, r.index, parentId ? [parentId] : []);
			moveHead(r, id);
			return `[${currentBranch(r) ?? "HEAD"} ${id}] ${msg}`;
		}
		case "log": {
			const start = opts.has("--all") ? null : headCommitId(r);
			const ids = opts.has("--all") ? [...new Set(Object.values(r.branches).flatMap((b) => ancestors(r, b)))] : ancestors(r, start);
			const order = Object.keys(r.commits);
			ids.sort((a, b) => order.indexOf(b) - order.indexOf(a));
			const refs = (id: string) => {
				const names = [
					...("branch" in r.head && r.branches[r.head.branch] === id ? [`HEAD -> ${r.head.branch}`] : []),
					...Object.entries(r.branches).filter(([n, c]) => c === id && !("branch" in r.head && r.head.branch === n)).map(([n]) => n),
					...Object.entries(r.remote).filter(([, c]) => c === id).map(([n]) => n),
				];
				return names.length ? ` (${names.join(", ")})` : "";
			};
			if (!ids.length) return "fatal: la rama actual no tiene commits todavía";
			return ids.map((id) => (opts.has("--oneline") ? `${id}${refs(id)} ${r.commits[id].message}` : `commit ${id}${refs(id)}\n\n    ${r.commits[id].message}\n`)).join("\n");
		}
		case "branch": {
			if (opts.has("-d") || opts.has("-D")) {
				const name = pos[0];
				if (!r.branches[name]) fail(`error: la rama '${name}' no existe`);
				if (currentBranch(r) === name) fail(`error: no puedes borrar la rama '${name}' en la que estás`);
				if (opts.has("-d") && !ancestors(r, headCommitId(r)).includes(r.branches[name])) fail(`error: la rama '${name}' no está fusionada. Usa -D para borrarla igualmente.`);
				delete r.branches[name];
				return `Rama ${name} eliminada.`;
			}
			if (opts.has("-m")) {
				const cur = currentBranch(r);
				const nuevo = rest[rest.indexOf("-m") + 1];
				if (!cur || !nuevo) fail("Uso: git branch -m <nuevo-nombre>");
				r.branches[nuevo] = r.branches[cur as string];
				delete r.branches[cur as string];
				r.head = { branch: nuevo };
				return "";
			}
			if (!pos.length) return Object.keys(r.branches).sort().map((b) => (b === currentBranch(r) ? `* ${b}` : `  ${b}`)).join("\n");
			const [name, start] = pos;
			if (r.branches[name]) fail(`fatal: ya existe una rama llamada '${name}'`);
			r.branches[name] = start ? resolve(r, start) : (headCommitId(r) ?? fail("fatal: no hay commits todavía"));
			return "";
		}
		case "switch":
		case "checkout": {
			const create = opts.has("-c") || opts.has("-b");
			const [name, start] = pos;
			if (!name) fail("fatal: falta el nombre de la rama");
			if (sub === "checkout" && !create && name !== "HEAD" && (r.work[name] !== undefined || r.index[name] !== undefined) && !r.branches[name]) {
				r.work[name] = r.index[name];
				return "";
			}
			if (create) {
				if (r.branches[name]) fail(`fatal: ya existe una rama llamada '${name}'`);
				const target = start ? resolve(r, start) : (headCommitId(r) as string);
				checkoutTree(r, target);
				r.branches[name] = target;
				r.head = { branch: name };
				return `Cambiado a nueva rama '${name}'`;
			}
			if (!r.branches[name]) fail(`fatal: referencia no válida: ${name}`);
			checkoutTree(r, r.branches[name]);
			r.head = { branch: name };
			return `Cambiado a rama '${name}'`;
		}
		case "reset": {
			const mode = opts.has("--hard") ? "hard" : opts.has("--soft") ? "soft" : "mixed";
			const isFile = (p: string) => (r.work[p] !== undefined || r.index[p] !== undefined) && !r.branches[p];
			if (pos.some(isFile)) {
				// git reset [HEAD] <archivo>: quitar del staging
				const h = headTree(r);
				for (const p of pos.filter(isFile)) put(r.index, p, h[p]);
				return "";
			}
			const target = resolve(r, pos[0] ?? "HEAD");
			moveHead(r, target);
			const tree = r.commits[target].tree;
			if (mode !== "soft") r.index = clone(tree);
			if (mode === "hard") r.work = clone(tree);
			return mode === "hard" ? `HEAD está ahora en ${target} ${r.commits[target].message}` : "";
		}
		case "revert": {
			if (localChanges(r).length) fail("error: tus cambios locales se sobrescribirían. Haz commit o stash antes de revertir.");
			const id = resolve(r, pos[0] ?? fail("uso: git revert <commit>"));
			const c = r.commits[id];
			if (c.parents.length !== 1) fail("error: este escenario no permite revertir commits de fusión");
			const tree = applyPatch(headTree(r), c.tree, r.commits[c.parents[0]].tree, `revert ${id}`);
			const nid = newCommit(r, `Revert "${c.message}"`, tree, [headCommitId(r) as string]);
			moveHead(r, nid);
			r.index = clone(tree);
			r.work = clone(tree);
			return `[${currentBranch(r)} ${nid}] Revert "${c.message}"`;
		}
		case "cherry-pick": {
			if (localChanges(r).length) fail("error: tus cambios locales se sobrescribirían. Haz commit o stash antes.");
			const id = resolve(r, pos[0] ?? fail("uso: git cherry-pick <commit>"));
			const c = r.commits[id];
			const parentTree = c.parents[0] ? r.commits[c.parents[0]].tree : {};
			const tree = applyPatch(headTree(r), parentTree, c.tree, `cherry-pick ${id}`);
			const nid = newCommit(r, c.message, tree, [headCommitId(r) as string]);
			moveHead(r, nid);
			r.index = clone(tree);
			r.work = clone(tree);
			return `[${currentBranch(r)} ${nid}] ${c.message}`;
		}
		case "merge": {
			if (localChanges(r).length) fail("error: tus cambios locales se sobrescribirían. Haz commit o stash antes de fusionar.");
			const other = resolve(r, pos[0] ?? fail("uso: git merge <rama>"));
			const mine = headCommitId(r) as string;
			const mineAnc = ancestors(r, mine);
			if (mineAnc.includes(other)) return "Ya está actualizado.";
			if (ancestors(r, other).includes(mine) && !opts.has("--no-ff")) {
				moveHead(r, other);
				r.index = clone(r.commits[other].tree);
				r.work = clone(r.commits[other].tree);
				return `Actualizando ${mine}..${other}\nFast-forward`;
			}
			const base = ancestors(r, other).find((c) => mineAnc.includes(c));
			const tree = applyPatch(headTree(r), base ? r.commits[base].tree : {}, r.commits[other].tree, `la fusión con ${pos[0]}`);
			const nid = newCommit(r, `Merge branch '${pos[0]}'`, tree, [mine, other]);
			moveHead(r, nid);
			r.index = clone(tree);
			r.work = clone(tree);
			return "Fusión hecha por la estrategia 'ort'.";
		}
		case "stash": {
			const action = pos[0] ?? "push";
			if (action === "list") return r.stash.map((s, i) => `stash@{${i}}: ${s.message}`).join("\n");
			if (action === "pop" || action === "apply") {
				const top = r.stash[0] ?? fail("No se encontraron entradas de stash.");
				const h = headTree(r);
				r.work = applyPatch(r.work, h, top.work, "el stash");
				r.index = applyPatch(r.index, h, top.index, "el stash");
				if (action === "pop") r.stash.shift();
				return action === "pop" ? "Eliminado refs/stash@{0}" : "";
			}
			if (!localChanges(r).length) return "No hay cambios locales que guardar";
			r.stash.unshift({ work: clone(r.work), index: clone(r.index), message: `WIP en ${currentBranch(r) ?? "HEAD"}: ${message ?? r.commits[headCommitId(r) as string].message}` });
			r.index = clone(headTree(r));
			r.work = clone(headTree(r));
			return "Directorio de trabajo y estado del índice guardados";
		}
		case "push": {
			const branch = currentBranch(r) ?? fail("fatal: no estás en ninguna rama");
			const local = r.branches[branch as string];
			const remoteRef = `origin/${branch}`;
			const published = r.remote[remoteRef];
			if (published && !ancestors(r, local).includes(published) && !opts.has("--force") && !opts.has("-f"))
				fail(`! [rechazado] ${branch} -> ${branch} (no es fast-forward)\nLa rama remota tiene commits que tú no tienes: estás reescribiendo historia publicada.`);
			r.remote[remoteRef] = local;
			return `To origin\n   ${published ?? "0000000"}..${local}  ${branch} -> ${branch}`;
		}
		case "show": {
			const id = resolve(r, pos[0] ?? "HEAD");
			const c = r.commits[id];
			const parent = c.parents[0] ? r.commits[c.parents[0]].tree : {};
			return `commit ${id}\n\n    ${c.message}\n\n${diffPaths(parent, c.tree).map((p) => ` ${parent[p] === undefined ? "A" : c.tree[p] === undefined ? "D" : "M"} ${p}`).join("\n")}`;
		}
		case "diff": {
			const changed = opts.has("--staged") || opts.has("--cached") ? diffPaths(headTree(r), r.index) : diffPaths(r.index, r.work);
			return changed.length ? changed.map((p) => `M ${p}`).join("\n") : "";
		}
		default:
			return fail(`git: '${sub ?? ""}' no es un comando de este laboratorio. Escribe help.`);
	}
}
