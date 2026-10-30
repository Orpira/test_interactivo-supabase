import { describe, expect, it } from "vitest";
import { LANDING_STATS } from "@/features/hero/landingStats";
import { challengeCatalog } from "@/content/challenges";
import { topicChallenges } from "@/content/topics";
import { INCIDENTS } from "@/content/incidents";
import { REVIEWS } from "@/content/reviews";
import { SQL_EXERCISES } from "@/content/topics/sql";
import { GIT_SCENARIOS } from "@/content/topics/git";
import { EXPLAIN_PROMPTS } from "@/content/explain";
import { PREDICT_QUESTIONS } from "@/content/questions/predict";

describe("cifras de la portada", () => {
	it("coinciden con el contenido real", () => {
		expect(LANDING_STATS).toEqual({
			challenges: challengeCatalog.length + topicChallenges.length,
			incidents: INCIDENTS.length,
			reviews: REVIEWS.length,
			sql: SQL_EXERCISES.length,
			git: GIT_SCENARIOS.length,
			explain: EXPLAIN_PROMPTS.length,
			predict: PREDICT_QUESTIONS.length,
		});
	});
});
