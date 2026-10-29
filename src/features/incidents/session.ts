import { useCallback, useEffect, useState } from "react";
import { pushEvent, type TimelineEvent } from "./timeline";

export type ClosedInfo = { score: number; durationMs: number; linesChanged: number; at: number };

export type IncidentProgress = {
	startedAt: number;
	timeline: TimelineEvent[];
	submits: number;
	failedSubmits: number;
	regressionBreaks: number;
	closed?: ClosedInfo;
};

const key = (id: string) => `webwiz-incident:${id}`;

function read(id: string): IncidentProgress | null {
	try {
		const raw = localStorage.getItem(key(id));
		return raw ? (JSON.parse(raw) as IncidentProgress) : null;
	} catch {
		return null;
	}
}

function fresh(): IncidentProgress {
	return { startedAt: Date.now(), timeline: [{ t: 0, kind: "start", label: "Abrió el ticket" }], submits: 0, failedSubmits: 0, regressionBreaks: 0 };
}

const CLOSED_KEY = "webwiz-incidents-closed";

/** Mejor cierre de cada incidencia en este dispositivo (para la lista). */
export function getClosedIncidents(): Record<string, ClosedInfo> {
	try {
		return JSON.parse(localStorage.getItem(CLOSED_KEY) ?? "{}") as Record<string, ClosedInfo>;
	} catch {
		return {};
	}
}

export function recordClosed(id: string, info: ClosedInfo) {
	const all = getClosedIncidents();
	if (!all[id] || all[id].score < info.score) all[id] = info;
	try {
		localStorage.setItem(CLOSED_KEY, JSON.stringify(all));
	} catch {
		// sin almacenamiento
	}
}

/**
 * Estado del diagnóstico (cronómetro, intentos y línea de tiempo) persistido
 * en el dispositivo: recargar no reinicia el reloj ni pierde los eventos.
 */
export function useIncidentSession(id: string) {
	const [progress, setProgress] = useState<IncidentProgress>(() => {
		const saved = read(id);
		// Una incidencia ya cerrada se reabre como un intento nuevo
		return saved && !saved.closed ? saved : fresh();
	});

	useEffect(() => {
		try {
			localStorage.setItem(key(id), JSON.stringify(progress));
		} catch {
			// sin almacenamiento
		}
	}, [id, progress]);

	const log = useCallback(
		(kind: TimelineEvent["kind"], label: string) =>
			setProgress((p) => (p.closed ? p : { ...p, timeline: pushEvent(p.timeline, { t: Date.now() - p.startedAt, kind, label }) })),
		[],
	);

	const restart = useCallback(() => setProgress(fresh()), []);

	return { progress, setProgress, log, restart };
}
