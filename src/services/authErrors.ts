/** Traduce los errores habituales de Supabase Auth a mensajes en español. */
const BY_CODE: Record<string, string> = {
	invalid_credentials: "Email o contraseña incorrectos.",
	email_not_confirmed:
		"Aún no has confirmado tu email. Revisa tu bandeja de entrada (y el spam).",
	user_already_exists:
		"Ese correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.",
	email_exists:
		"Ese correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.",
	weak_password:
		"La contraseña es demasiado débil. Usa al menos 6 caracteres combinando letras y números.",
	same_password: "La nueva contraseña debe ser distinta de la anterior.",
	over_email_send_rate_limit:
		"Has pedido demasiados correos seguidos. Espera unos minutos e inténtalo de nuevo.",
	over_request_rate_limit:
		"Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
	signup_disabled: "El registro con email está desactivado temporalmente.",
	email_address_invalid: "Ese correo no es válido.",
	validation_failed: "Revisa los datos introducidos.",
	session_not_found: "El enlace ha caducado o ya se usó. Solicita uno nuevo.",
	flow_state_not_found:
		"El enlace ha caducado o se abrió en otro navegador. Solicita uno nuevo desde este dispositivo.",
	flow_state_expired: "El enlace ha caducado. Solicita uno nuevo.",
	captcha_failed:
		"La verificación de seguridad ha fallado o ha caducado. Vuelve a completarla.",
};

const BY_MESSAGE: [RegExp, string][] = [
	[/invalid login credentials/i, BY_CODE.invalid_credentials],
	[/email not confirmed/i, BY_CODE.email_not_confirmed],
	[/already registered/i, BY_CODE.user_already_exists],
	[/password should be at least/i, BY_CODE.weak_password],
	[/captcha/i, BY_CODE.captcha_failed],
	[/rate limit/i, BY_CODE.over_request_rate_limit],
	[
		/failed to fetch|network/i,
		"Sin conexión con el servidor. Comprueba tu red.",
	],
];

export function translateAuthError(error: unknown): string {
	const { code, message } = (error ?? {}) as {
		code?: string;
		message?: string;
	};
	if (code && BY_CODE[code]) return BY_CODE[code];
	const match = message && BY_MESSAGE.find(([re]) => re.test(message));
	if (match) return match[1];
	return message || "Ha ocurrido un error. Inténtalo de nuevo.";
}
