import { useEffect, useMemo, useRef } from "react";
import { buildDocument } from "../engine/buildDocument";
import { SANDBOX } from "../engine/runner";
import type { ChallengeFiles } from "../engine/types";
import type { ConsoleEntry } from "./ConsolePanel";

let nextId = 0;

/**
 * Vista previa aislada (sin allow-same-origin). Reenvía la consola del
 * iframe a la app y la limpia en cada recarga.
 */
export default function PreviewFrame({
	files,
	onConsole,
	onReload,
	className = "",
}: {
	files: ChallengeFiles;
	onConsole: (entry: ConsoleEntry) => void;
	onReload: () => void;
	className?: string;
}) {
	const ref = useRef<HTMLIFrameElement>(null);
	const srcDoc = useMemo(() => buildDocument(files), [files]);

	useEffect(() => {
		onReload();
		// eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar el documento
	}, [srcDoc]);

	useEffect(() => {
		const onMessage = (e: MessageEvent) => {
			if (e.source !== ref.current?.contentWindow) return;
			const d = e.data as { __webwiz?: string; level?: ConsoleEntry["level"]; args?: string[] };
			if (d?.__webwiz !== "console") return;
			onConsole({ id: nextId++, level: d.level ?? "log", text: (d.args ?? []).join(" ") });
		};
		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, [onConsole]);

	return (
		<iframe
			ref={ref}
			title="Vista previa del reto"
			className={`h-full w-full bg-white ${className}`}
			srcDoc={srcDoc}
			sandbox={SANDBOX}
		/>
	);
}
