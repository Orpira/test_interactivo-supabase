// Genera supabase/migrations/20261029_fase1_retos_seed.sql desde el catálogo TS.
// Uso: npm run db:challenges-seed
import { build } from "esbuild";
import { writeFileSync, mkdtempSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const out = join(mkdtempSync(join(tmpdir(), "webwiz-")), "seed.mjs");

await build({
	stdin: {
		contents: `export { challengeCatalog } from "@/content/challenges";
export { challengesToSql } from "@/content/challenges/toSql";`,
		resolveDir: root,
	},
	bundle: true,
	platform: "node",
	format: "esm",
	outfile: out,
	alias: { "@": join(root, "src") },
	logLevel: "error",
});

const { challengeCatalog, challengesToSql } = await import(pathToFileURL(out).href);
const target = join(root, "supabase/migrations/20261029_fase1_retos_seed.sql");
writeFileSync(target, challengesToSql(challengeCatalog));
console.log(`✔ ${challengeCatalog.length} retos → ${target}`);
