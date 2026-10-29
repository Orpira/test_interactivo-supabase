import type { ChallengeSpec } from "@/features/challenges/engine/types";
import type { IncidentSpec } from "@/features/incidents/types";

const TAG = "$webwiz_spec$";

const literal = (value: string) => `'${value.replace(/'/g, "''")}'`;

/**
 * SQL idempotente que inserta/actualiza los retos del catálogo en la tabla
 * `challenges` (columna `spec` con el reto completo).
 */
export function challengesToSql(challenges: ChallengeSpec[]): string {
	const rows = challenges.map((c) => {
		const json = JSON.stringify(c);
		if (json.includes(TAG)) throw new Error(`El reto ${c.id} contiene ${TAG}`);
		const concepts = `ARRAY[${c.concepts.map(literal).join(", ")}]::TEXT[]`;
		return `  (${literal(c.id)}, ${literal(c.title)}, ${literal(c.instructions)}, ${literal(c.category)}, 'challenge', ${literal(c.difficulty)}, ${concepts}, ${TAG}${json}${TAG}::jsonb, false)`;
	});
	return `-- Generado por \`npm run db:challenges-seed\` a partir de src/content/challenges.
-- No editar a mano: cambia el catálogo y vuelve a generarlo.
INSERT INTO challenges (id, title, instructions, category, type, difficulty, concepts, spec, legacy)
VALUES
${rows.join(",\n")}
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  instructions = EXCLUDED.instructions,
  category = EXCLUDED.category,
  type = EXCLUDED.type,
  difficulty = EXCLUDED.difficulty,
  concepts = EXCLUDED.concepts,
  spec = EXCLUDED.spec,
  legacy = false;
`;
}

/**
 * SQL idempotente para las incidencias (Fase 3): misma tabla `challenges`
 * con type = 'incident' y categoría 'incidencias'.
 */
export function incidentsToSql(incidents: IncidentSpec[]): string {
	const rows = incidents.map((c) => {
		const json = JSON.stringify(c);
		if (json.includes(TAG)) throw new Error(`La incidencia ${c.id} contiene ${TAG}`);
		const concepts = `ARRAY[${c.concepts.map(literal).join(", ")}]::TEXT[]`;
		const instructions = `${c.ticket.actual}. Esperado: ${c.ticket.expected}`;
		return `  (${literal(c.id)}, ${literal(c.title)}, ${literal(instructions)}, 'incidencias', 'incident', ${literal(c.difficulty)}, ${concepts}, ${TAG}${json}${TAG}::jsonb, false)`;
	});
	return `-- Generado por \`npm run db:challenges-seed\` a partir de src/content/incidents.
-- No editar a mano: cambia el catálogo y vuelve a generarlo.
INSERT INTO challenges (id, title, instructions, category, type, difficulty, concepts, spec, legacy)
VALUES
${rows.join(",\n")}
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  instructions = EXCLUDED.instructions,
  category = EXCLUDED.category,
  type = EXCLUDED.type,
  difficulty = EXCLUDED.difficulty,
  concepts = EXCLUDED.concepts,
  spec = EXCLUDED.spec,
  legacy = false;
`;
}
