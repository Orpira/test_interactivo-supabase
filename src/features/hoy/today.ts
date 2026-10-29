import { INCIDENTS } from "@/content/incidents";
import { challengeCatalog } from "@/content/challenges";

/** Incidencia del día: rota cada día (misma para todos). */
export function incidentOfDay(today: Date = new Date()) {
	const day = Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86_400_000);
	return INCIDENTS[day % INCIDENTS.length];
}

export function greeting(today: Date = new Date()) {
	const h = today.getHours();
	return h < 6 ? "Buenas noches" : h < 14 ? "Buenos días" : h < 21 ? "Buenas tardes" : "Buenas noches";
}

export type ContinueItem = { title: string; detail: string; progress: number; to: string };

/** Enlace para retomar un quiz guardado a partir de su clave de sesión. */
export function resumeQuiz(key: string | null, index: number, total: number): ContinueItem | null {
	if (!key || total === 0 || index >= total) return null;
	const [a, b, c] = key.split("|");
	const progress = index / total;
	const detail = `${index}/${total}`;
	if (a === "repaso") return { title: "Repaso de hoy", detail, progress, to: `/repaso?conceptos=${b}&count=${c}` };
	if (a === "diagnostico") return { title: "Diagnóstico inicial", detail, progress, to: "/diagnostico" };
	const title = `Quiz de ${a.charAt(0).toUpperCase()}${a.slice(1)}${b ? ` · ${b}` : ""}`;
	return { title, detail, progress, to: `/quiz/${encodeURIComponent(a)}${b ? `/${encodeURIComponent(b)}` : ""}?count=${c}` };
}

/** Último borrador de reto o incidencia guardado en el dispositivo. */
export function lastDraft(storage: Storage = localStorage): ContinueItem | null {
	let best: { id: string; savedAt: number } | null = null;
	for (let i = 0; i < storage.length; i++) {
		const k = storage.key(i);
		if (!k?.startsWith("webwiz-draft:")) continue;
		try {
			const d = JSON.parse(storage.getItem(k) ?? "{}") as { savedAt?: number };
			if (d.savedAt && (!best || d.savedAt > best.savedAt)) best = { id: k.slice("webwiz-draft:".length), savedAt: d.savedAt };
		} catch {
			// borrador ilegible
		}
	}
	if (!best) return null;
	const inc = INCIDENTS.find((x) => x.id === best.id);
	if (inc) return { title: `Ticket #${inc.number}`, detail: inc.title, progress: 0.5, to: `/incidencias/${inc.id}` };
	const ch = challengeCatalog.find((x) => x.id === best.id);
	if (ch) return { title: ch.title, detail: `Reto de ${ch.category.toUpperCase()}`, progress: 0.5, to: `/editor/${ch.category}/${ch.id}` };
	return null;
}

export { DIAGNOSTIC_DONE_KEY } from "@/features/learning/diagnosis";
