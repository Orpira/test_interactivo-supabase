export type EditorLanguage = "html" | "css" | "javascript";

export function languageOfFile(name: string): EditorLanguage {
	if (name.endsWith(".css")) return "css";
	if (name.endsWith(".js")) return "javascript";
	return "html";
}

export function toEditorLanguage(value?: string | null): EditorLanguage {
	const v = value?.toLowerCase();
	if (v === "css") return "css";
	if (v === "javascript" || v === "js") return "javascript";
	return "html";
}

export const LEVEL_LABEL: Record<string, string> = {
	junior: "Junior",
	semi_senior: "Semi senior",
	senior: "Senior",
};
