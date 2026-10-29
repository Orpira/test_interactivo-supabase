/** Formato de reto de la Fase 1 (ver docs de especificación). */
export type ChallengeFiles = {
	"index.html": string;
	"styles.css": string;
	"app.js": string;
};

export type FileName = keyof ChallengeFiles;

export const FILE_NAMES: FileName[] = ["index.html", "styles.css", "app.js"];

export type ChallengeTest =
	| {
			name: string;
			/** Se ejecuta en el iframe tras cargar la página: DOM y estilos calculados */
			type: "dom";
			code: string;
			/** Mensaje si falla (si el test no devuelve uno propio) */
			message?: string;
	  }
	| {
			name: string;
			/** Llama a funciones definidas en app.js (en un Web Worker aislado) */
			type: "js";
			code: string;
			message?: string;
	  }
	| {
			name: string;
			/** Salida de consola esperada al ejecutar app.js */
			type: "console";
			expected: string;
			message?: string;
	  };

export type ChallengeLevel = "junior" | "semi_senior" | "senior";
export type ChallengeCategory = "html" | "css" | "javascript";

export type ChallengeSpec = {
	id: string;
	title: string;
	category: ChallengeCategory;
	difficulty: ChallengeLevel;
	concepts: string[];
	instructions: string;
	files: ChallengeFiles;
	editable: FileName[];
	tests: ChallengeTest[];
	hints: string[];
	/** Archivos que cambian respecto al código inicial para resolver el reto */
	solution: Partial<ChallengeFiles>;
};

export type TestResult = {
	name: string;
	passed: boolean;
	message: string;
};

export const TEST_TIMEOUT_MS = 2000;
