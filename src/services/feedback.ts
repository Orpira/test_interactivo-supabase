import { supabase } from "./supabase";

export type ExperienceLevel = "junior" | "semi_senior" | "senior";

export const EXPERIENCE_STORAGE_KEY = "experienceLevel";

export function getStoredExperienceLevel(): ExperienceLevel | null {
	const value = localStorage.getItem(EXPERIENCE_STORAGE_KEY);
	if (value === "junior" || value === "semi_senior" || value === "senior") {
		return value;
	}
	return null;
}

export function setStoredExperienceLevel(level: ExperienceLevel) {
	localStorage.setItem(EXPERIENCE_STORAGE_KEY, level);
}

export async function upsertUserExperience(userId: string, level: ExperienceLevel) {
	const { error } = await supabase.from("user_experience").upsert(
		{
			user_id: userId,
			level,
			updated_at: new Date().toISOString(),
		},
		{ onConflict: "user_id" },
	);

	if (error) {
		throw error;
	}
}

export async function canUserSendFeedback(userId: string): Promise<boolean> {
	const { data, error } = await supabase
		.from("quiz_feedback")
		.select("created_at")
		.eq("user_id", userId)
		.order("created_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error) {
		throw error;
	}

	if (!data?.created_at) {
		return true;
	}

	const lastFeedbackDate = new Date(data.created_at);
	const now = new Date();
	const diffMs = now.getTime() - lastFeedbackDate.getTime();
	const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

	return diffMs >= sevenDaysMs;
}

export async function saveQuizFeedback(params: {
	userId: string;
	experienceLevel: ExperienceLevel;
	rating: number;
	comment?: string;
	reason?: "dificultad" | "claridad" | "errores_tecnicos" | "desactualizado";
	quizId?: string;
}) {
	const { error } = await supabase.from("quiz_feedback").insert({
		user_id: params.userId,
		experience_level: params.experienceLevel,
		rating: params.rating,
		comment: params.comment ?? null,
		reason: params.reason ?? null,
		quiz_id: params.quizId ?? null,
	});

	if (error) {
		throw error;
	}
}
