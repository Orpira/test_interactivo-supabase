import { Capacitor } from "@capacitor/core";

/**
 * Vibración háptica en Android (plugin Haptics de Capacitor). En web no hace
 * nada. Respeta "reducir movimiento" del sistema.
 */
export async function hapticFeedback(kind: "success" | "error") {
	if (!Capacitor.isNativePlatform()) return;
	if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
	try {
		const { Haptics, ImpactStyle, NotificationType } = await import(
			"@capacitor/haptics"
		);
		if (kind === "success") await Haptics.impact({ style: ImpactStyle.Light });
		else await Haptics.notification({ type: NotificationType.Warning });
	} catch {
		// plugin no disponible (APK sin sincronizar): se ignora
	}
}
