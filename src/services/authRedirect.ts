import { Capacitor } from "@capacitor/core";

export const MOBILE_AUTH_REDIRECT_URL =
	import.meta.env.VITE_MOBILE_AUTH_REDIRECT_URL ?? "webwizquiz://auth/callback";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

/**
 * En la web, la vuelta del login es SIEMPRE al mismo dominio desde el que se
 * inició (webwiz.orpira.es, la URL de Vercel o una vista previa). El flujo
 * PKCE guarda su verificador en el localStorage de ese dominio: si Supabase
 * devolviera al usuario a otro dominio, el código no se podría canjear y la
 * sesión no se iniciaría. VITE_AUTH_REDIRECT_URL solo se usa fuera del
 * navegador. Cada dominio debe estar en Supabase → Authentication → URL
 * Configuration → Redirect URLs (https://<dominio>/auth/callback).
 */
export function getWebAuthRedirectUrl() {
	const origin =
		typeof window !== "undefined" && window.location?.origin && window.location.origin !== "null"
			? window.location.origin
			: (import.meta.env.VITE_AUTH_REDIRECT_URL ?? "https://webwiz.orpira.es");
	return `${trimTrailingSlash(origin)}/auth/callback`;
}

export function getAuthRedirectUrl() {
	return Capacitor.isNativePlatform()
		? MOBILE_AUTH_REDIRECT_URL
		: getWebAuthRedirectUrl();
}

export function isMobileAuthCallback(url: string) {
	return url.startsWith(MOBILE_AUTH_REDIRECT_URL);
}
