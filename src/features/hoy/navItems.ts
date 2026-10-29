import { BarChart3, Code2, Map, Sun, Target, Trophy, User, type LucideIcon } from "lucide-react";

export type ShellItem = { to: string; label: string; short: string; icon: LucideIcon; keys: string; match: RegExp };

/** Navegación de la zona con sesión: barra lateral (escritorio) e inferior (móvil). */
export const SIDEBAR_ITEMS: ShellItem[] = [
	{ to: "/hoy", label: "Hoy", short: "Hoy", icon: Sun, keys: "G H", match: /^\/hoy/ },
	{ to: "/practicar", label: "Practicar", short: "Practicar", icon: Target, keys: "G P", match: /^\/(practicar|repaso)/ },
	{ to: "/editor", label: "Retos e incidencias", short: "Retos", icon: Code2, keys: "G R", match: /^\/(editor|incidencias)/ },
	{ to: "/mapa", label: "Mapa de habilidades", short: "Mapa", icon: Map, keys: "G M", match: /^\/mapa/ },
	{ to: "/ranking", label: "Ranking", short: "Ranking", icon: Trophy, keys: "G K", match: /^\/ranking/ },
];

export const BOTTOM_ITEMS: ShellItem[] = [
	SIDEBAR_ITEMS[0],
	SIDEBAR_ITEMS[1],
	SIDEBAR_ITEMS[2],
	SIDEBAR_ITEMS[3],
	{ to: "/dashboard", label: "Perfil", short: "Perfil", icon: User, keys: "G D", match: /^\/(dashboard|historial)/ },
];

export const SHORTCUTS: Record<string, string> = { h: "/hoy", p: "/practicar", r: "/editor", m: "/mapa", k: "/ranking", d: "/dashboard" };

export const PROFILE_ICON = BarChart3;
