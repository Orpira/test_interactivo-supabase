/**
 * Conceptos: unidad del repaso espaciado y del mapa de habilidades.
 * Las preguntas pueden traer `concepts` explícitos; si no, el concepto se
 * deriva de la subcategoría (o la categoría). La misma lógica existe en SQL
 * (funciones webwiz_slug y webwiz_area, ver scripts/generate-learning-sql.mjs).
 */
export const AREAS = ["HTML", "CSS", "JavaScript", "Backend", "SQL", "Linux", "DevOps", "Testing", "Accesibilidad", "Seguridad", "Rendimiento", "IA"] as const;
export type Area = (typeof AREAS)[number];

/**
 * Reglas para deducir el área de un texto (subcategoría o categoría).
 * Solo alternancias simples: se traducen tal cual a expresiones POSIX de Postgres.
 */
export const AREA_RULES: [string, Area][] = [
	["html|semantic|formulario|form|accesib|a11y|seo", "HTML"],
	["css|flex|grid|responsive|tailwind|sass|layout|animaci", "CSS"],
	["linux|bash|shell|terminal|permisos", "Linux"],
	["docker|kubernetes|devops|git|deploy|despliegue|nginx|ci/cd|pipeline", "DevOps"],
	["test|jest|vitest|cypress|playwright|e2e|tdd", "Testing"],
	["sql|postgres|base de datos|database|backend|express|api|rest|node", "Backend"],
	["javascript|typescript|react|dom|js|async|promesa|closure|evento", "JavaScript"],
];

const CATEGORY_AREA: Record<string, Area> = {
	frontend: "JavaScript",
	backend: "Backend",
	devops: "DevOps",
	testing: "Testing",
	linux: "Linux",
};

export function slugify(text: string): string {
	return text
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function areaFor(text: string | null | undefined, category?: string | null): Area {
	const t = (text ?? "").toLowerCase();
	for (const [pattern, area] of AREA_RULES) if (t && new RegExp(pattern).test(t)) return area;
	const c = (category ?? "").toLowerCase();
	if (CATEGORY_AREA[c]) return CATEGORY_AREA[c];
	for (const [pattern, area] of AREA_RULES) if (c && new RegExp(pattern).test(c)) return area;
	return "JavaScript";
}

export type ConceptRef = { id: string; name: string; area: Area };

/** Catálogo curado: nombres legibles para los conceptos más habituales. */
export const CONCEPT_CATALOG: ConceptRef[] = [
	{ id: "closures", name: "Closures", area: "JavaScript" },
	{ id: "event-loop", name: "Event loop", area: "JavaScript" },
	{ id: "hoisting", name: "Hoisting", area: "JavaScript" },
	{ id: "this", name: "this", area: "JavaScript" },
	{ id: "coercion", name: "Coerción de tipos", area: "JavaScript" },
	{ id: "promises", name: "Promesas", area: "JavaScript" },
	{ id: "array-methods", name: "Métodos de array", area: "JavaScript" },
	{ id: "scope", name: "Ámbito (scope)", area: "JavaScript" },
	{ id: "references", name: "Referencias y copias", area: "JavaScript" },
];

/** Conceptos de los temas de la Fase 5 (se insertan con su propio seed). */
export const EXTRA_CONCEPTS: ConceptRef[] = [
	{ id: "xss", name: "XSS", area: "Seguridad" },
	{ id: "rls", name: "Políticas RLS", area: "Seguridad" },
	{ id: "sql-inyeccion", name: "Inyección SQL", area: "Seguridad" },
	{ id: "seguridad-credenciales", name: "Credenciales y secretos", area: "Seguridad" },
	{ id: "seguridad-eval", name: "eval y código dinámico", area: "Seguridad" },
	{ id: "seguridad-cabeceras", name: "Cabeceras de seguridad", area: "Seguridad" },
	{ id: "csrf", name: "CSRF", area: "Seguridad" },
	{ id: "react-hooks", name: "Hooks de React", area: "JavaScript" },
	{ id: "react-listas", name: "Listas y keys en React", area: "JavaScript" },
	{ id: "a11y-imagenes", name: "Imágenes accesibles", area: "Accesibilidad" },
	{ id: "a11y-formularios", name: "Formularios accesibles", area: "Accesibilidad" },
	{ id: "a11y-dialogos", name: "Diálogos accesibles", area: "Accesibilidad" },
	{ id: "a11y-contraste", name: "Contraste", area: "Accesibilidad" },
	{ id: "a11y-semantica", name: "Semántica y landmarks", area: "Accesibilidad" },
	{ id: "sql-consultas", name: "SELECT y filtros", area: "SQL" },
	{ id: "sql-joins", name: "JOIN", area: "SQL" },
	{ id: "sql-agregados", name: "GROUP BY y agregados", area: "SQL" },
	{ id: "sql-subconsultas", name: "Subconsultas y CTE", area: "SQL" },
	{ id: "sql-indices", name: "Índices", area: "SQL" },
	{ id: "sql-rendimiento", name: "Rendimiento de consultas", area: "SQL" },
	{ id: "git-commits", name: "Commits y staging", area: "DevOps" },
	{ id: "git-ramas", name: "Ramas", area: "DevOps" },
	{ id: "git-deshacer", name: "Deshacer en Git", area: "DevOps" },
	{ id: "web-vitals", name: "Core Web Vitals", area: "Rendimiento" },
	{ id: "carga-recursos", name: "Carga de recursos", area: "Rendimiento" },
	{ id: "render-bloqueo", name: "Bloqueo del renderizado", area: "Rendimiento" },
	{ id: "ia-revision", name: "Revisar código de IA", area: "IA" },
	{ id: "ia-explicar", name: "Explicar con tus palabras", area: "IA" },
];

const CATALOG_BY_ID = new Map([...CONCEPT_CATALOG, ...EXTRA_CONCEPTS].map((c) => [c.id, c]));

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Conceptos de una pregunta (explícitos o derivados de su subcategoría/categoría). */
export function conceptsForQuestion(q: {
	concepts?: string[] | null;
	category?: string | null;
	subcategory?: string | null;
}): ConceptRef[] {
	if (q.concepts && q.concepts.length > 0) {
		return q.concepts.map((id) => CATALOG_BY_ID.get(id) ?? { id, name: titleCase(id.replace(/-/g, " ")), area: areaFor(id, q.category) });
	}
	const base = q.subcategory?.trim() || q.category?.trim();
	if (!base) return [];
	const id = slugify(base);
	return [CATALOG_BY_ID.get(id) ?? { id, name: titleCase(base), area: areaFor(q.subcategory, q.category) }];
}
