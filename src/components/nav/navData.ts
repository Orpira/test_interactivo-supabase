import {
	BarChart3,
	Sun,
	Bug,
	Code2,
	FlaskConical,
	History,
	Home,
	Bot,
	MessageSquareText,
	Database,
	GitBranch,
	FilePlus2,
	Map,
	Target,
	Mail,
	Monitor,
	Server,
	Container,
	Trophy,
	type LucideIcon,
} from "lucide-react";

export type QuizCategory = {
	key: string;
	label: string;
	desc: string;
	icon: LucideIcon;
};

export const QUIZ_CATEGORIES: QuizCategory[] = [
	{
		key: "frontend",
		label: "Frontend",
		desc: "HTML, CSS, JavaScript y React",
		icon: Monitor,
	},
	{
		key: "backend",
		label: "Backend",
		desc: "APIs, bases de datos y Linux",
		icon: Server,
	},
	{
		key: "devops",
		label: "DevOps",
		desc: "Docker, CI/CD y despliegue",
		icon: Container,
	},
	{
		key: "testing",
		label: "Testing",
		desc: "Unitarios, integración y E2E",
		icon: FlaskConical,
	},
];

export type NavPage = {
	to: string;
	label: string;
	icon: LucideIcon;
	private?: boolean;
	/** Solo sin sesión (con sesión el inicio es /hoy) */
	publicOnly?: boolean;
	keywords?: string;
};

export const NAV_PAGES: NavPage[] = [
	{ to: "/", label: "Inicio", icon: Home, keywords: "portada home", publicOnly: true },
	{ to: "/hoy", label: "Hoy", icon: Sun, private: true, keywords: "inicio plan repaso racha" },
	{
		to: "/editor",
		label: "Retos",
		icon: Code2,
		private: true,
		keywords: "editor codigo practicar",
	},
	{
		to: "/incidencias",
		label: "Incidencias",
		icon: Bug,
		private: true,
		keywords: "bugs tickets depurar devtools arreglar",
	},
	{
		to: "/mapa",
		label: "Mapa de habilidades",
		icon: Map,
		private: true,
		keywords: "conceptos dominados reforzar progreso",
	},
	{
		to: "/practicar",
		label: "Practicar",
		icon: Target,
		private: true,
		keywords: "quiz repaso diagnostico preguntas",
	},
	{ to: "/revisiones", label: "Revisa el código de la IA", icon: Bot, private: true, keywords: "pr review ia fallos seguridad" },
	{ to: "/explica", label: "Explícalo tú", icon: MessageSquareText, private: true, keywords: "explicar claude abierta" },
	{ to: "/sql", label: "Laboratorio SQL", icon: Database, private: true, keywords: "postgres consultas base de datos" },
	{ to: "/git", label: "Git en escenarios", icon: GitBranch, private: true, keywords: "terminal commit rama reset revert" },
	{ to: "/crear", label: "Crear contenido", icon: FilePlus2, private: true, keywords: "editor publicar reto incidencia comunidad" },
	{
		to: "/ranking",
		label: "Ranking",
		icon: Trophy,
		private: true,
		keywords: "clasificacion puntuaciones",
	},
	{
		to: "/dashboard",
		label: "Dashboard",
		icon: BarChart3,
		private: true,
		keywords: "progreso estadisticas logros",
	},
	{
		to: "/historial",
		label: "Historial",
		icon: History,
		private: true,
		keywords: "resultados codigo guardado",
	},
	{
		to: "/contacto",
		label: "Contacto",
		icon: Mail,
		keywords: "escribir ayuda",
	},
];

/** Minúsculas y sin tildes, para buscar "dificil" y encontrar "difícil". */
export const normalize = (s: string) =>
	s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
