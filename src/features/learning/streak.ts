/**
 * Racha diaria con protector semanal: si un día no hay actividad y queda
 * protector, la racha sobrevive y se gasta el protector. Se recarga 1 cada
 * semana (lunes), sin acumular más de 1.
 */
export type Streak = {
	current: number;
	best: number;
	freezes: number;
	/** YYYY-MM-DD (día local) de la última actividad */
	lastActive: string | null;
	/** Lunes (YYYY-MM-DD) de la semana en que se recargó el protector */
	freezeWeek: string | null;
	/** Días (YYYY-MM-DD) completados o protegidos, para los 7 puntos de la semana */
	days: string[];
	/** Días salvados con protector */
	frozen: string[];
};

export const EMPTY_STREAK: Streak = { current: 0, best: 0, freezes: 1, lastActive: null, freezeWeek: null, days: [], frozen: [] };

export const dayKey = (d: Date) =>
	`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const parse = (key: string) => {
	const [y, m, d] = key.split("-").map(Number);
	return new Date(y, m - 1, d);
};

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export function mondayOf(d: Date): string {
	const wd = (d.getDay() + 6) % 7; // lunes = 0
	return dayKey(addDays(d, -wd));
}

const diffDays = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 86_400_000);

/** Recarga semanal del protector (máx. 1). */
function refill(s: Streak, today: Date): Streak {
	const week = mondayOf(today);
	if (s.freezeWeek === week) return s;
	return { ...s, freezes: Math.max(s.freezes, 1), freezeWeek: week };
}

/**
 * Estado de la racha "a fecha de hoy" sin registrar actividad: aplica los
 * protectores a los días perdidos o rompe la racha si no quedan.
 */
export function settleStreak(input: Streak, today: Date = new Date()): Streak {
	let s = refill(input, today);
	if (!s.lastActive) return s;
	const gap = diffDays(s.lastActive, dayKey(today));
	if (gap <= 1) return s;
	// Días sin actividad entre lastActive y hoy (sin contar hoy)
	const missed = gap - 1;
	if (missed <= s.freezes) {
		const frozen = Array.from({ length: missed }, (_, i) => dayKey(addDays(parse(s.lastActive as string), i + 1)));
		s = {
			...s,
			freezes: s.freezes - missed,
			frozen: [...s.frozen, ...frozen].slice(-30),
			days: [...s.days, ...frozen].slice(-30),
			// Los días protegidos cuentan como cubiertos: la racha continúa mañana desde ayer
			lastActive: dayKey(addDays(today, -1)),
		};
		return s;
	}
	return { ...s, current: 0 };
}

/** Registra actividad hoy. */
export function recordActivity(input: Streak, today: Date = new Date()): Streak {
	const s = settleStreak(input, today);
	const key = dayKey(today);
	if (s.lastActive === key) return s;
	const continues = s.lastActive !== null && diffDays(s.lastActive, key) === 1 && s.current > 0;
	const current = continues ? s.current + 1 : 1;
	return {
		...s,
		current,
		best: Math.max(s.best, current),
		lastActive: key,
		days: [...s.days.filter((d) => d !== key), key].slice(-30),
	};
}

/** Los 7 días de la semana actual (L–D) con su estado. */
export type DotState = "hecho" | "protegido" | "perdido" | "hoy" | "futuro";

export function weekDots(s: Streak, today: Date = new Date()): { label: string; key: string; state: DotState }[] {
	const monday = parse(mondayOf(today));
	return ["L", "M", "X", "J", "V", "S", "D"].map((label, i) => {
		const key = dayKey(addDays(monday, i));
		const todayKey = dayKey(today);
		const state: DotState = s.frozen.includes(key)
			? "protegido"
			: s.days.includes(key)
				? "hecho"
				: key > todayKey
					? "futuro"
					: key === todayKey
						? "hoy"
						: "perdido";
		return { label, key, state };
	});
}
