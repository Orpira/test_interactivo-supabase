import { useEffect, useMemo, useState } from "react";
import SimpleCodeEditor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism.css";
import { useAuth } from "../../services/auth";
import { supabase } from "../../services/supabase";
import {
	toLanguage,
	validateChallenge,
	type ChallengeLanguage,
	type ValidationResult,
} from "@/utils/challengeValidation";

type EditorProps = {
	starterCode?: string;
	categoryFromChallenge?: string;
	expectedOutput?: string;
	challengeId?: string;
	onSolved?: () => void;
};

const TEMPLATES: Record<ChallengeLanguage, string> = {
	html: "<h1>Hola Mundo</h1>",
	css: "body { background-color: lightblue; }",
	javascript: "console.log('Hola desde JavaScript!');",
};

// HTML de ejemplo sobre el que se aplica el CSS en la vista previa
const CSS_PREVIEW_HTML = `<div class="container"><p>Vista previa</p></div>`;

export default function Editor({
	starterCode,
	categoryFromChallenge,
	expectedOutput,
	challengeId,
	onSolved,
}: EditorProps) {
	const language = toLanguage(categoryFromChallenge);
	const [code, setCode] = useState(() => starterCode ?? TEMPLATES[language]);
	const [result, setResult] = useState<ValidationResult | null>(null);
	const [validating, setValidating] = useState(false);
	const [saving, setSaving] = useState(false);
	const [saveMessage, setSaveMessage] = useState<string | null>(null);
	const { isAuthenticated, user } = useAuth();

	// Al cambiar de reto, reiniciar el editor
	useEffect(() => {
		setCode(starterCode ?? TEMPLATES[language]);
		setResult(null);
		setSaveMessage(null);
	}, [starterCode, language, challengeId]);

	// La vista previa se actualiza con un pequeño retardo para no recargar
	// el iframe en cada pulsación.
	const [previewCode, setPreviewCode] = useState(code);
	useEffect(() => {
		const t = setTimeout(() => setPreviewCode(code), 400);
		return () => clearTimeout(t);
	}, [code]);

	const srcDoc = useMemo(() => {
		if (language === "css")
			return `<style>${previewCode}</style>${CSS_PREVIEW_HTML}`;
		if (language === "javascript")
			return `<pre id="out" style="font-family:monospace;white-space:pre-wrap"></pre><script>
const out=document.getElementById('out');
const log=(...a)=>{out.textContent+=a.map(x=>typeof x==='object'?JSON.stringify(x):String(x)).join(' ')+'\\n'};
console.log=log;console.info=log;console.warn=log;console.error=log;
window.onerror=(m)=>{log('Error: '+m)};
</script><script>${previewCode.replace(/<\/script/gi, "<\\/script")}</script>`;
		return previewCode;
	}, [language, previewCode]);

	const handleValidate = async () => {
		if (!expectedOutput) return;
		setValidating(true);
		try {
			const res = await validateChallenge(language, code, expectedOutput);
			setResult(res);
			if (res.ok) onSolved?.();
		} finally {
			setValidating(false);
		}
	};

	const handleSave = async () => {
		if (!isAuthenticated || !user) return;
		setSaving(true);
		setSaveMessage(null);
		const { error } = await supabase.from("envios_codigo").insert({
			userId: user.id,
			name: user.user_metadata?.full_name || "",
			email: user.email || "",
			language,
			code,
			category: language,
			timestamp: new Date().toISOString(),
		});
		setSaving(false);
		setSaveMessage(
			error
				? `❌ No se pudo guardar: ${error.message}`
				: "💾 Código guardado en tu historial"
		);
	};

	return (
		<div className="w-full">
			<div className="grid gap-6 md:grid-cols-2">
				<div>
					<div className="mb-2 flex items-center justify-between">
						<h3 className="text-xl font-semibold dark:text-slate-100">
							Tu código ({language.toUpperCase()})
						</h3>
						<button
							type="button"
							onClick={() => {
								setCode(starterCode ?? TEMPLATES[language]);
								setResult(null);
							}}
							className="text-sm text-gray-600 underline hover:text-gray-900"
						>
							Restablecer
						</button>
					</div>
					<SimpleCodeEditor
						value={code}
						onValueChange={setCode}
						highlight={(c) =>
							Prism.highlight(
								c,
								Prism.languages[language === "html" ? "markup" : language],
								language
							)
						}
						padding={10}
						textareaId="challenge-code"
						aria-label="Editor de código"
						className="border rounded font-mono min-h-[300px] md:min-h-[400px] text-sm bg-gray-100 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
					/>
				</div>

				<div>
					<h3 className="mb-2 text-xl font-semibold dark:text-slate-100">
						Vista previa
					</h3>
					{/* Sin allow-same-origin: el código del usuario no puede leer
					    la sesión ni el almacenamiento de la app. */}
					<iframe
						title="Vista previa"
						className="w-full h-[300px] md:h-[400px] border bg-white dark:border-slate-700"
						srcDoc={srcDoc}
						sandbox="allow-scripts allow-modals"
					/>
				</div>
			</div>

			<div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-3">
				{expectedOutput && (
					<button
						type="button"
						onClick={handleValidate}
						disabled={validating}
						className="w-full sm:w-auto bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 transition disabled:opacity-60"
					>
						{validating ? "Comprobando..." : "Verificar solución"}
					</button>
				)}
				{isAuthenticated && (
					<button
						type="button"
						onClick={handleSave}
						disabled={saving}
						className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
					>
						{saving ? "Guardando..." : "Guardar código"}
					</button>
				)}
			</div>

			<div aria-live="polite" className="mt-4 space-y-2 text-center">
				{result && (
					<div
						className={`mx-auto max-w-2xl rounded-lg border p-3 text-left ${
							result.ok
								? "border-green-300 bg-green-50 text-green-800"
								: "border-red-300 bg-red-50 text-red-800"
						}`}
					>
						<p className="font-semibold">{result.message}</p>
						{result.details.length > 0 && (
							<ul className="mt-2 list-disc pl-5 text-sm">
								{result.details.map((d) => (
									<li key={d}>{d}</li>
								))}
							</ul>
						)}
					</div>
				)}
				{saveMessage && <p className="text-sm">{saveMessage}</p>}
			</div>
		</div>
	);
}
