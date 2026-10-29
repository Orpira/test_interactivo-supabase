/** Liga semanal: grupos de 20 por nivel; suben los 5 primeros y bajan los 5 últimos. */
export const LEAGUE_SIZE = 20;
export const PROMOTE = 5;

export const DIVISION: Record<string, string> = {
	junior: "Bronce",
	semi_senior: "Plata",
	senior: "Oro",
};

export type LeagueRow = { user_id: string; name: string; points: number; position: number; is_me: boolean };

export type LeagueSummary = {
	division: string;
	position: number;
	size: number;
	zone: "sube" | "baja" | "se-mantiene";
	daysLeft: number;
};

export function leagueSummary(rows: LeagueRow[], level: string, today: Date = new Date()): LeagueSummary | null {
	const me = rows.find((r) => r.is_me);
	if (!me) return null;
	const size = rows.length;
	const zone = me.position <= PROMOTE && me.points > 0 ? "sube" : size > PROMOTE * 2 && me.position > size - PROMOTE ? "baja" : "se-mantiene";
	// La liga cierra el domingo a medianoche
	const daysLeft = 7 - ((today.getDay() + 6) % 7);
	return { division: DIVISION[level] ?? "Bronce", position: me.position, size, zone, daysLeft };
}
