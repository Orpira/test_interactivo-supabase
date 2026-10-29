import { useEffect, useState } from "react";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/services/auth";
import { getStoredExperienceLevel } from "@/services/feedback";
import { leagueSummary, type LeagueRow, type LeagueSummary } from "./league";

/** Grupo de la liga semanal del usuario (función weekly_league de la Fase 4). */
export function useLeague(): { rows: LeagueRow[]; summary: LeagueSummary | null; loading: boolean; unavailable: boolean } {
	const { user } = useAuth();
	const [state, setState] = useState<{ rows: LeagueRow[]; loading: boolean; unavailable: boolean }>({ rows: [], loading: true, unavailable: false });

	useEffect(() => {
		if (!user) {
			setState({ rows: [], loading: false, unavailable: true });
			return;
		}
		let cancelled = false;
		void supabase.rpc("weekly_league").then(({ data, error }) => {
			if (cancelled) return;
			if (error) {
				console.warn("Liga semanal no disponible:", error.message);
				setState({ rows: [], loading: false, unavailable: true });
			} else setState({ rows: (data ?? []) as LeagueRow[], loading: false, unavailable: false });
		});
		return () => {
			cancelled = true;
		};
	}, [user]);

	const level = (state.rows.find((r) => r.is_me) as (LeagueRow & { level?: string }) | undefined)?.level ?? getStoredExperienceLevel() ?? "junior";
	return { ...state, summary: leagueSummary(state.rows, level) };
}
