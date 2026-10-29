import SimpleCodeEditor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";

import type { EditorLanguage } from "./languages";

const PRISM_LANG: Record<EditorLanguage, string> = {
	html: "markup",
	css: "css",
	javascript: "javascript",
};

/**
 * Editor ligero con resaltado (Prism). En la Fase 2 se sustituye por CodeMirror 6.
 * Los colores salen de los tokens del tema (ver .code-editor en index.css).
 */
export default function CodeEditor({
	value,
	onChange,
	language,
	readOnly = false,
	id,
	label,
	minHeight = "18rem",
}: {
	value: string;
	onChange?: (value: string) => void;
	language: EditorLanguage;
	readOnly?: boolean;
	id: string;
	label: string;
	minHeight?: string;
}) {
	return (
		<div
			className={`code-editor overflow-auto rounded-lg border border-line bg-surface font-mono text-sm ${readOnly ? "opacity-90" : ""}`}
			style={{ minHeight }}
		>
			<SimpleCodeEditor
				value={value}
				onValueChange={(v) => !readOnly && onChange?.(v)}
				highlight={(code) =>
					Prism.highlight(code, Prism.languages[PRISM_LANG[language]], PRISM_LANG[language])
				}
				padding={14}
				readOnly={readOnly}
				textareaId={id}
				aria-label={label}
				tabSize={2}
				insertSpaces
				style={{ minHeight, fontFamily: "inherit", fontVariantLigatures: "none" }}
				textareaClassName="focus:outline-none"
			/>
		</div>
	);
}
