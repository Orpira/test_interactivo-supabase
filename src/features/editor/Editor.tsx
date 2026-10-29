import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../services/auth";
import { supabase } from "../../services/supabase";
import CodeMirrorEditor from "./CodeMirrorEditor";
import type { EditorLanguage } from "./languages";
import { buildDocument } from "@/features/challenges/engine/buildDocument";
import { SANDBOX } from "@/features/challenges/engine/runner";

const TEMPLATES: Record<EditorLanguage, string> = {
	html: "<h1>Hola Mundo</h1>",
	css: "body { background-color: lightblue; }",
	javascript: "console.log('Hola desde JavaScript!');",
};

const CSS_PREVIEW_HTML = `<div class="container"><p>Vista previa</p></div>`;

/** Editor libre (código abierto desde el historial): vista previa y guardado. */
export default function Editor({
	starterCode,
	language,
}: {
	starterCode?: string;
	language: EditorLanguage;
}) {
	const [code, setCode] = useState(() => starterCode ?? TEMPLATES[language]);
	const [saving, setSaving] = useState(false);
	const [saveMessage, setSaveMessage] = useState<string | null>(null);
	const { isAuthenticated, user } = useAuth();

	const [previewCode, setPreviewCode] = useState(code);
	useEffect(() => {
		const t = setTimeout(() => setPreviewCode(code), 400);
		return () => clearTimeout(t);
	}, [code]);

	const srcDoc = useMemo(
		() =>
			buildDocument({
				"index.html": language === "html" ? previewCode : language === "css" ? CSS_PREVIEW_HTML : "",
				"styles.css": language === "css" ? previewCode : "",
				"app.js": language === "javascript" ? previewCode : "",
			}),
		[language, previewCode],
	);

	const handleSave = async () => {
		if (!user) return;
		setSaving(true);
		const { error } = await supabase.from("envios_codigo").insert({
			userId: user.id,
			name: user.user_metadata?.full_name || "",
			language,
			code,
			category: language,
			timestamp: new Date().toISOString(),
		});
		setSaving(false);
		setSaveMessage(error ? `No se pudo guardar: ${error.message}` : "Código guardado en tu historial");
	};

	return (
		<div className="w-full">
			<div className="grid gap-6 md:grid-cols-2">
				<div>
					<h2 className="mb-2 font-display text-lg font-semibold">Tu código ({language.toUpperCase()})</h2>
					<CodeMirrorEditor label="Editor de código" value={code} onChange={setCode} language={language} minHeight="18rem" />
				</div>
				<div>
					<h2 className="mb-2 font-display text-lg font-semibold">Vista previa</h2>
					<iframe
						title="Vista previa"
						className="h-72 w-full rounded-lg border border-line bg-white"
						srcDoc={srcDoc}
						sandbox={SANDBOX}
					/>
				</div>
			</div>
			{isAuthenticated && (
				<div className="mt-6 flex flex-col items-center gap-2">
					<button
						type="button"
						onClick={handleSave}
						disabled={saving}
						className="min-h-touch rounded-md bg-accent px-5 py-2 font-semibold text-accent-fg hover:bg-accent/90 disabled:opacity-60"
					>
						{saving ? "Guardando..." : "Guardar código"}
					</button>
					<p aria-live="polite" className="text-sm text-muted">
						{saveMessage}
					</p>
				</div>
			)}
		</div>
	);
}
