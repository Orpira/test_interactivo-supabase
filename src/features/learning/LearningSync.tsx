import { useLearningSync } from "./useLearningSync";

/** Sincroniza el progreso de aprendizaje con la cuenta (se carga en diferido). */
export default function LearningSync() {
	useLearningSync();
	return null;
}
