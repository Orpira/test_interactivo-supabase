/** Abre la ventana de acceso (la monta Navbar) desde cualquier pantalla. */
export const OPEN_LOGIN_EVENT = "webwiz:open-login";

export function openLogin() {
	window.dispatchEvent(new CustomEvent(OPEN_LOGIN_EVENT));
}
