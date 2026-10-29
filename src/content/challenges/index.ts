import type { ChallengeSpec } from "@/features/challenges/engine/types";
import { htmlChallenges } from "./html";
import { cssChallenges } from "./css";
import { javascriptChallenges } from "./javascript";

/** Retos de la Fase 1: 10 HTML, 10 CSS y 10 JavaScript, verificados en CI. */
export const challengeCatalog: ChallengeSpec[] = [
	...htmlChallenges,
	...cssChallenges,
	...javascriptChallenges,
];
