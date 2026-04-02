const CATEGORY_ALIASES: Record<string, string[]> = {
	frontend: ["frontend", "Frontend"],
	backend: ["backend", "Backend"],
	devops: ["devops", "DevOps"],
	testing: ["testing", "Testing"],
};

export function getCategoryVariants(category: string): string[] {
	const normalized = decodeURIComponent(category).trim();
	if (!normalized) return [];

	const lower = normalized.toLowerCase();
	const title = lower.charAt(0).toUpperCase() + lower.slice(1);

	return Array.from(
		new Set([normalized, lower, title, ...(CATEGORY_ALIASES[lower] ?? [])]),
	);
}
