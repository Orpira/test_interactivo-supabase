import { useEffect, type RefObject } from "react";

/** Cierra un menú al hacer clic fuera o pulsar Escape (devolviendo el foco). */
export function useDismiss(
	open: boolean,
	ref: RefObject<HTMLElement | null>,
	onClose: () => void,
	returnFocus?: RefObject<HTMLElement | null>
) {
	useEffect(() => {
		if (!open) return;
		const onPointer = (e: PointerEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) onClose();
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
				returnFocus?.current?.focus();
			}
		};
		document.addEventListener("pointerdown", onPointer);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("pointerdown", onPointer);
			document.removeEventListener("keydown", onKey);
		};
	}, [open, ref, onClose, returnFocus]);
}
