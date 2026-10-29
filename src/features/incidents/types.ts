import type {
	ChallengeFiles,
	ChallengeLevel,
	ChallengeTest,
	FileName,
	NetworkMock,
} from "@/features/challenges/engine/types";

export type IncidentArea = "css" | "javascript" | "accesibilidad" | "seguridad";

/** Incidencia: mini-app con un fallo real, un ticket y tests ocultos. */
export type IncidentSpec = {
	id: string;
	number: number;
	type: "incident";
	title: string;
	area: IncidentArea;
	difficulty: ChallengeLevel;
	concepts: string[];
	/** Duración orientativa en minutos */
	durationMin: number;
	ticket: {
		reporter: string;
		priority: "alta" | "media" | "baja";
		device: string;
		steps: string[];
		expected: string;
		actual: string;
	};
	/** Ancho de la vista previa con el que se reproduce el fallo */
	viewport: 390 | 768 | 1280;
	files: ChallengeFiles;
	editable: FileName[];
	networkLog: NetworkMock[];
	/** Aceptación (ocultos): verifican el arreglo */
	tests: ChallengeTest[];
	/** Regresión: lo que ya funcionaba debe seguir funcionando */
	regressionTests: ChallengeTest[];
	hints: string[];
	solution: Partial<ChallengeFiles>;
	rootCause: string;
	/** Propiedades CSS a resaltar en el panel Elementos */
	suspects: string[];
};

export const AREA_LABEL: Record<IncidentArea, string> = {
	css: "CSS / maquetación",
	javascript: "JavaScript",
	accesibilidad: "Accesibilidad",
	seguridad: "Seguridad",
};
