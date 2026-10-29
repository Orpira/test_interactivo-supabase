export type TimelineKind =
	| "start"
	| "edit"
	| "hint"
	| "panel"
	| "viewport"
	| "inspect"
	| "submit-fail"
	| "regression"
	| "solved";

/** Evento del diagnóstico. `t` = ms desde que se abrió la incidencia. */
export type TimelineEvent = { t: number; kind: TimelineKind; label: string };

export const TIMELINE_LIMIT = 60;

/** Añade un evento evitando repetir el mismo seguido (muchas ediciones del mismo archivo cuentan como una). */
export function pushEvent(list: TimelineEvent[], event: TimelineEvent): TimelineEvent[] {
	const last = list[list.length - 1];
	if (event.kind === "edit" && last?.kind === "edit" && last.label === event.label) return [...list.slice(0, -1), event];
	if (last && last.kind === event.kind && last.label === event.label) return list;
	const next = [...list, event];
	// Se conservan siempre el inicio y los últimos eventos
	return next.length > TIMELINE_LIMIT ? [next[0], ...next.slice(-(TIMELINE_LIMIT - 1))] : next;
}

export function formatClock(ms: number): string {
	const s = Math.max(0, Math.floor(ms / 1000));
	return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
