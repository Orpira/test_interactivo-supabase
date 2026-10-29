import { useEffect, useMemo, useRef, type RefObject } from "react";
import { buildDocument, type BuildOptions } from "../engine/buildDocument";
import { SANDBOX } from "../engine/runner";
import type { ChallengeFiles } from "../engine/types";
import type { ConsoleEntry } from "./ConsolePanel";

let nextId = 0;

/**
 * Vista previa aislada (sin allow-same-origin). Reenvía la consola del
 * iframe a la app y la limpia en cada recarga. `onBridgeMessage` recibe el
 * resto de mensajes del iframe (red simulada, inspector).
 */
export default function PreviewFrame({
	files,
	onConsole,
	onReload,
	options,
	onBridgeMessage,
	frameRef,
	title = "Vista previa del reto",
	className = "",
}: {
	files: ChallengeFiles;
	onConsole: (entry: ConsoleEntry) => void;
	onReload: () => void;
	options?: Pick<BuildOptions, "network" | "inspector">;
	onBridgeMessage?: (data: { __webwiz: string } & Record<string, unknown>) => void;
	frameRef?: RefObject<HTMLIFrameElement | null>;
	title?: string;
	className?: string;
}) {
	const ownRef = useRef<HTMLIFrameElement>(null);
	const ref = frameRef ?? ownRef;
	const srcDoc = useMemo(() => buildDocument(files, options), [files, options]);

	useEffect(() => {
		onReload();
		// eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar el documento
	}, [srcDoc]);

	useEffect(() => {
		const onMessage = (e: MessageEvent) => {
			if (e.source !== ref.current?.contentWindow) return;
			const d = e.data as { __webwiz?: string; level?: ConsoleEntry["level"]; args?: string[] };
			if (!d?.__webwiz) return;
			if (d.__webwiz === "console") {
				onConsole({ id: nextId++, level: d.level ?? "log", text: (d.args ?? []).join(" ") });
			} else {
				onBridgeMessage?.(d as { __webwiz: string } & Record<string, unknown>);
			}
		};
		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, [onConsole, onBridgeMessage, ref]);

	return (
		<iframe
			ref={ref}
			title={title}
			className={`h-full w-full bg-white ${className}`}
			srcDoc={srcDoc}
			sandbox={SANDBOX}
		/>
	);
}
