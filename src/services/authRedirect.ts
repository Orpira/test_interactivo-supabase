import { Capacitor } from "@capacitor/core";

export const MOBILE_AUTH_REDIRECT_URL =
	import.meta.env.VITE_MOBILE_AUTH_REDIRECT_URL ?? "webwizquiz://auth/callback";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

function isLocalDevOrigin(origin: string) {
	return (
		origin.includes("localhost") ||
		origin.includes("127.0.0.1") ||
		origin.includes("0.0.0.0")
	);
}

export function getWebAuthRedirectUrl() {
	const configuredUrl = import.meta.env.VITE_AUTH_REDIRECT_URL;
	const origin =
		typeof window !== "undefined" ? window.location.origin : "https://orpira.es";
	const shouldUseCurrentOrigin =
		import.meta.env.DEV || isLocalDevOrigin(origin) || !configuredUrl;

	return `${trimTrailingSlash(
		shouldUseCurrentOrigin ? origin : configuredUrl,
	)}/auth/callback`;
}

export function getAuthRedirectUrl() {
	return Capacitor.isNativePlatform()
		? MOBILE_AUTH_REDIRECT_URL
		: getWebAuthRedirectUrl();
}

export function isMobileAuthCallback(url: string) {
	return url.startsWith(MOBILE_AUTH_REDIRECT_URL);
}
