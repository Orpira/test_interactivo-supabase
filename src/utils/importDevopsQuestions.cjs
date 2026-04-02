require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error("Falta VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env");
	process.exit(1);
}

const sourcePath = "/home/orpira/Descargas/devops_questions.json";
if (!fs.existsSync(sourcePath)) {
	console.error(`No se encontro el archivo: ${sourcePath}`);
	process.exit(1);
}

const raw = fs.readFileSync(sourcePath, "utf-8");
const parsed = JSON.parse(raw);
const supabase = createClient(supabaseUrl, supabaseKey);

function normalizePayload(data) {
	const output = [];
	for (const categoryBlock of data.categories || []) {
		for (const sub of categoryBlock.subcategories || []) {
			const subcategoryName = sub.name;
			for (const q of sub.questions || []) {
				output.push({
					question: q.question,
					options: q.options,
					correctAnswer: q.correctAnswer,
					category: "devops",
					subcategory: subcategoryName,
					shortExplanation: q.shortExplanation || null,
					sourceUrl: q.sourceUrl || null,
					sourceName: q.sourceName || null,
				});
			}
		}
	}
	return output;
}

async function detectSubcategoryColumn() {
	const trySubcategory = await supabase
		.from("questions")
		.select("id,subcategory")
		.limit(1);
	if (!trySubcategory.error) return "subcategory";

	const trySubcategoria = await supabase
		.from("questions")
		.select("id,subcategoria")
		.limit(1);
	if (!trySubcategoria.error) return "subcategoria";

	console.error(
		"No se detecto columna de subcategoria (subcategory/subcategoria) en questions.",
	);
	console.error("Error subcategory:", trySubcategory.error?.message);
	console.error("Error subcategoria:", trySubcategoria.error?.message);
	process.exit(1);
}

async function run() {
	const allRows = normalizePayload(parsed);
	const subcategoryColumn = await detectSubcategoryColumn();

	const { data: existing, error: fetchError } = await supabase
		.from("questions")
		.select(`question,${subcategoryColumn}`)
		.in("category", ["devops", "DevOps"]);

	if (fetchError) {
		console.error(
			"Error consultando preguntas existentes:",
			fetchError.message,
		);
		process.exit(1);
	}

	const existingKeys = new Set(
		(existing || []).map(
			(row) => `${row.question}|||${row[subcategoryColumn] || ""}`,
		),
	);

	const toInsert = allRows
		.filter((row) => !existingKeys.has(`${row.question}|||${row.subcategory}`))
		.map((row) => {
			if (subcategoryColumn === "subcategory") {
				return row;
			}
			const { subcategory, ...rest } = row;
			return { ...rest, subcategoria: subcategory };
		});

	if (toInsert.length === 0) {
		console.log(
			`No hay nuevas preguntas para insertar. Total analizadas: ${allRows.length}`,
		);
		return;
	}

	const chunkSize = 100;
	let inserted = 0;

	for (let i = 0; i < toInsert.length; i += chunkSize) {
		const chunk = toInsert.slice(i, i + chunkSize);
		const { error } = await supabase.from("questions").insert(chunk);
		if (error) {
			console.error("Error insertando lote:", error.message);
			process.exit(1);
		}
		inserted += chunk.length;
	}

	console.log(
		`Importacion completada. Analizadas: ${allRows.length}. Insertadas: ${inserted}.`,
	);
}

run().catch((err) => {
	console.error("Error inesperado:", err);
	process.exit(1);
});
