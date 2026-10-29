import { useEffect, useState } from "react";
import { supabase } from "@/services/supabase";
import { AREAS, CONCEPT_CATALOG, type Area, type ConceptRef } from "./concepts";
import type { StoredCard } from "./fsrs";

let cache: ConceptRef[] | null = null;

/** Conceptos de la tabla `concepts` (o el catálogo local si no hay migración). */
export function useConceptCatalog(): ConceptRef[] {
	const [list, setList] = useState<ConceptRef[]>(cache ?? CONCEPT_CATALOG);
	useEffect(() => {
		if (cache) return;
		let cancelled = false;
		void supabase
			.from("concepts")
			.select("id, name, area")
			.then(({ data, error }) => {
				if (cancelled || error || !data?.length) return;
				cache = data as ConceptRef[];
				setList(cache);
			});
		return () => {
			cancelled = true;
		};
	}, []);
	return list;
}

/** Une catálogo y tarjetas (un concepto puede existir solo en tus tarjetas) y agrupa por área. */
export function groupByArea(catalog: ConceptRef[], cards: Record<string, StoredCard>): { area: Area; concepts: ConceptRef[] }[] {
	const all = new Map<string, ConceptRef>(catalog.map((c) => [c.id, c]));
	for (const c of Object.values(cards)) if (!all.has(c.conceptId)) all.set(c.conceptId, { id: c.conceptId, name: c.name, area: c.area as Area });
	return AREAS.map((area) => ({
		area,
		concepts: [...all.values()].filter((c) => c.area === area).sort((a, b) => a.name.localeCompare(b.name, "es")),
	})).filter((g) => g.concepts.length > 0);
}
