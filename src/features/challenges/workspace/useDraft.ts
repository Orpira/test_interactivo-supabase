import { useEffect, useRef, useState } from "react";
import type { ChallengeFiles, ChallengeSpec, FileName } from "../engine/types";

/** Lo mínimo para guardar borradores: sirve para retos e incidencias. */
export type DraftSource = Pick<ChallengeSpec, "id" | "files" | "editable" | "hints">;

type Draft = { files: Partial<ChallengeFiles>; hints: number; savedAt: number };

const key = (id: string) => `webwiz-draft:${id}`;

function readDraft(id: string): Draft | null {
	try {
		const raw = localStorage.getItem(key(id));
		return raw ? (JSON.parse(raw) as Draft) : null;
	} catch {
		return null;
	}
}

/**
 * Archivos del reto con guardado automático del borrador en localStorage:
 * recargar la página (o cerrar la app) conserva lo escrito.
 */
export function useDraft(challenge: DraftSource) {
	const initial = useRef(readDraft(challenge.id));
	const [files, setFiles] = useState<ChallengeFiles>(() => ({
		...challenge.files,
		...pickEditable(initial.current?.files ?? {}, challenge.editable),
	}));
	const [hintsShown, setHintsShown] = useState(() =>
		Math.min(initial.current?.hints ?? 0, challenge.hints.length),
	);
	const [savedAt, setSavedAt] = useState<number | null>(initial.current?.savedAt ?? null);

	useEffect(() => {
		const t = setTimeout(() => {
			const edited = pickEditable(files, challenge.editable);
			const pristine = challenge.editable.every((f) => files[f] === challenge.files[f]);
			try {
				if (pristine && hintsShown === 0) localStorage.removeItem(key(challenge.id));
				else {
					const now = Date.now();
					localStorage.setItem(key(challenge.id), JSON.stringify({ files: edited, hints: hintsShown, savedAt: now }));
					setSavedAt(now);
				}
			} catch {
				// sin almacenamiento disponible
			}
		}, 500);
		return () => clearTimeout(t);
	}, [files, hintsShown, challenge]);

	const reset = () => {
		setFiles(challenge.files);
		try {
			localStorage.removeItem(key(challenge.id));
		} catch {
			// nada
		}
		setSavedAt(null);
	};

	return {
		files,
		setFile: (name: FileName, value: string) => setFiles((prev) => ({ ...prev, [name]: value })),
		reset,
		hintsShown,
		setHintsShown,
		restored: !!initial.current,
		savedAt,
	};
}

function pickEditable(files: Partial<ChallengeFiles>, editable: FileName[]) {
	return Object.fromEntries(
		editable.filter((f) => typeof files[f] === "string").map((f) => [f, files[f]]),
	) as Partial<ChallengeFiles>;
}
