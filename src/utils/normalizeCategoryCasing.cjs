require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error("Falta VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env");
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const KNOWN_CATEGORIES = new Set(["frontend", "backend", "devops", "testing"]);

function getCanonicalCategory(value) {
	if (typeof value !== "string") return null;
	const normalized = value.trim().toLowerCase();
	if (!normalized) return null;
	if (!KNOWN_CATEGORIES.has(normalized)) return null;
	return normalized;
}

async function normalizeTable(tableName) {
	const probe = await supabase.from(tableName).select("category").limit(1);
	if (probe.error) {
		console.log(
			`Tabla ${tableName}: omitida (${probe.error.message || "sin columna category"}).`,
		);
		return { updates: 0, scanned: 0, tableName };
	}

	const { data, error } = await supabase.from(tableName).select("category");
	if (error) {
		console.error(`Error leyendo ${tableName}:`, error.message);
		process.exit(1);
	}

	const distinctCurrent = Array.from(
		new Set((data || []).map((row) => row.category).filter(Boolean)),
	);

	const updates = [];
	for (const current of distinctCurrent) {
		const canonical = getCanonicalCategory(current);
		if (canonical && canonical !== current) {
			updates.push({ from: current, to: canonical });
		}
	}

	let updatedRows = 0;
	for (const change of updates) {
		const { error: updateError, count } = await supabase
			.from(tableName)
			.update({ category: change.to })
			.eq("category", change.from)
			.select("category", { count: "exact", head: true });

		if (updateError) {
			console.error(
				`Error actualizando ${tableName} (${change.from} -> ${change.to}):`,
				updateError.message,
			);
			process.exit(1);
		}

		updatedRows += count || 0;
		console.log(
			`Tabla ${tableName}: ${change.from} -> ${change.to} (${count || 0} filas).`,
		);
	}

	if (updates.length === 0) {
		console.log(`Tabla ${tableName}: no hubo cambios de casing para aplicar.`);
	}

	return { updates: updatedRows, scanned: (data || []).length, tableName };
}

async function run() {
	const tables = ["questions", "resultados"];
	const results = [];

	for (const tableName of tables) {
		results.push(await normalizeTable(tableName));
	}

	const totalUpdated = results.reduce((acc, r) => acc + r.updates, 0);
	console.log(`Normalizacion finalizada. Filas actualizadas: ${totalUpdated}.`);
}

run().catch((err) => {
	console.error("Error inesperado en normalizacion:", err);
	process.exit(1);
});
