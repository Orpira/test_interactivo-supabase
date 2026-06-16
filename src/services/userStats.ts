// services/userStats.ts
import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";
import { UserStats } from "../types/UserStats";

export async function updateUserStats(
	user: User,
	category: string,
	correct: number,
	total: number,
) {
	const email = user.email!;
	const now = new Date().toISOString();

	const { data: existing } = await supabase
		.from("user_stats")
		.select("*")
		.eq("email", email)
		.single();

	let stats: UserStats;

	if (existing) {
		stats = existing.stats as UserStats;
	} else {
		stats = {
			totalTests: 0,
			lastTestAt: now,
			categories: {},
		};
	}

	const catStats = stats.categories[category] || {
		tests: 0,
		correctAnswers: 0,
		totalQuestions: 0,
	};

	catStats.tests += 1;
	catStats.correctAnswers += correct;
	catStats.totalQuestions += total;

	stats.categories[category] = catStats;
	stats.totalTests += 1;
	stats.lastTestAt = now;

	await supabase
		.from("user_stats")
		.upsert({ email, stats, updated_at: now }, { onConflict: "email" });
}
