export type Theme = "dark" | "light";

const STORAGE_KEY = "webwiz-theme";

/** Tema guardado; oscuro por defecto. */
export function getStoredTheme(): Theme {
	try {
		return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
	} catch {
		return "dark";
	}
}

export function applyTheme(theme: Theme) {
	document.documentElement.classList.toggle("dark", theme === "dark");
	try {
		localStorage.setItem(STORAGE_KEY, theme);
	} catch {
		// almacenamiento no disponible (modo privado): solo se aplica en memoria
	}
}
