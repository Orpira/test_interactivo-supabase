#!/usr/bin/env node
// Propone, con Claude, conceptos y "confusión + por qué tienta" para cada
// opción incorrecta de las preguntas existentes. NO escribe en la base de
// datos: genera un JSON para revisión humana y, después, el SQL a importar.
//
// 1) Proponer (lee las preguntas con la clave anónima; la de Claude solo en tu máquina):
//    SUPABASE_URL=... SUPABASE_ANON_KEY=... ANTHROPIC_API_KEY=... \
//      node scripts/label-questions.mjs propose [--limit 50] [--out supabase/labels/propuesta.json]
// 2) Revisa y corrige el JSON a mano (campo "approved": true en las que valgan).
// 3) Generar SQL con las aprobadas:
//      node scripts/label-questions.mjs sql supabase/labels/propuesta.json > supabase/labels/import.sql
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const [, , cmd, ...args] = process.argv;
const arg = (name, def) => {
	const i = args.indexOf(`--${name}`);
	return i >= 0 ? args[i + 1] : def;
};

const SYSTEM = `Eres un profesor de desarrollo web. Para cada pregunta tipo test devuelves SOLO JSON válido con esta forma:
{"concepts": ["slug-concepto", ...], "option_meta": {"<texto exacto de cada opción incorrecta>": {"misconception": "...", "whyTempting": "..."}}}
- concepts: 1 a 3 slugs en minúsculas con guiones (p. ej. "closures", "event-loop", "flexbox", "sql-joins").
- misconception: la confusión concreta que lleva a elegir esa opción (máx. 15 palabras).
- whyTempting: por qué parece correcta (máx. 20 palabras).
Todo en español.`;

async function propose() {
	const { SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY } = process.env;
	if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !ANTHROPIC_API_KEY) throw new Error("Faltan SUPABASE_URL, SUPABASE_ANON_KEY o ANTHROPIC_API_KEY");
	const limit = Number(arg("limit", "50"));
	const out = arg("out", "supabase/labels/propuesta.json");
	const res = await fetch(`${SUPABASE_URL}/rest/v1/questions?select=id,question,options,correctAnswer,category,subcategory,option_meta&option_meta=is.null&limit=${limit}`, {
		headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
	});
	if (!res.ok) throw new Error(`Supabase: ${res.status} ${await res.text()}`);
	const questions = await res.json();
	const proposals = [];
	for (const q of questions) {
		const options = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
		const prompt = `Pregunta (${q.category}${q.subcategory ? ` / ${q.subcategory}` : ""}): ${q.question}\nOpciones: ${JSON.stringify(options)}\nCorrecta: ${q.correctAnswer}`;
		const r = await fetch("https://api.anthropic.com/v1/messages", {
			method: "POST",
			headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
			body: JSON.stringify({ model: process.env.CLAUDE_MODEL ?? "claude-sonnet-5-5", max_tokens: 800, system: SYSTEM, messages: [{ role: "user", content: prompt }] }),
		});
		const data = await r.json();
		const text = data?.content?.[0]?.text ?? "";
		let parsed = null;
		try {
			parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
		} catch {
			console.warn(`✗ ${q.id}: respuesta no válida, se omite`);
		}
		if (parsed) proposals.push({ id: q.id, question: q.question, correctAnswer: q.correctAnswer, approved: false, ...parsed });
		process.stdout.write(".");
	}
	mkdirSync(dirname(out), { recursive: true });
	writeFileSync(out, JSON.stringify(proposals, null, 2));
	console.log(`\n✔ ${proposals.length} propuestas → ${out}. Revísalas y marca "approved": true.`);
}

function toSql(file) {
	const items = JSON.parse(readFileSync(file, "utf8")).filter((p) => p.approved);
	const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;
	const lines = items.map(
		(p) =>
			`UPDATE questions SET concepts = ARRAY[${p.concepts.map(lit).join(", ")}]::TEXT[], option_meta = ${lit(JSON.stringify(p.option_meta))}::jsonb WHERE id = ${lit(p.id)};`,
	);
	const concepts = [...new Set(items.flatMap((p) => p.concepts))].map(
		(c) => `INSERT INTO concepts (id, name, area) VALUES (${lit(c)}, ${lit(c.charAt(0).toUpperCase() + c.slice(1).replace(/-/g, " "))}, 'JavaScript') ON CONFLICT (id) DO NOTHING;`,
	);
	console.log(`-- ${items.length} preguntas revisadas. Revisa el área de los conceptos nuevos antes de ejecutar.\nBEGIN;\n${concepts.join("\n")}\n${lines.join("\n")}\nCOMMIT;`);
}

if (cmd === "propose") await propose();
else if (cmd === "sql" && args[0]) toSql(args[0]);
else console.log("Uso: node scripts/label-questions.mjs propose | sql <archivo.json>");
