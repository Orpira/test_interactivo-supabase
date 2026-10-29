import { useEffect, useState } from "react";
import { supabase } from "@/services/supabase";
import { INCIDENTS } from "@/content/incidents";
import type { IncidentSpec } from "./types";

let cache: IncidentSpec[] | null = null;

/** Incidencias del repo más las publicadas por la comunidad en Supabase (/crear). */
export function useIncidentCatalog(): { incidents: IncidentSpec[]; loaded: boolean } {
	const [list, setList] = useState<IncidentSpec[]>(cache ?? INCIDENTS);
	const [loaded, setLoaded] = useState(!!cache);
	useEffect(() => {
		if (cache) return;
		let cancelled = false;
		void supabase
			.from("challenges")
			.select("id, spec")
			.eq("type", "incident")
			.eq("legacy", false)
			.then(({ data }) => {
				if (cancelled) return;
				const known = new Set(INCIDENTS.map((i) => i.id));
				const extra = ((data ?? []) as { id: string; spec: IncidentSpec | null }[])
					.filter((r) => r.spec && !known.has(r.id) && Array.isArray(r.spec.tests) && Array.isArray(r.spec.regressionTests))
					.map((r) => ({ ...(r.spec as IncidentSpec), id: r.id }));
				cache = [...INCIDENTS, ...extra];
				setList(cache);
				setLoaded(true);
			});
		return () => {
			cancelled = true;
		};
	}, []);
	return { incidents: list, loaded };
}
