import type { ChallengeSpec } from "@/features/challenges/engine/types";
import { a11yChallenges } from "./accesibilidad";
import { securityChallenges } from "./seguridad";
import { performanceChallenges } from "./rendimiento";

/** Retos de los temas nuevos de la Fase 5 (10 por tema), verificados en CI. */
export const topicChallenges: ChallengeSpec[] = [...a11yChallenges, ...securityChallenges, ...performanceChallenges];
