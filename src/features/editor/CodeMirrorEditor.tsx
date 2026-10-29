import { useMemo } from "react";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { linter, lintGutter, type Diagnostic } from "@codemirror/lint";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import type { EditorLanguage } from "./languages";
import { lintCss, lintHtml, lintJs } from "./linters";

const v = (name: string, alpha?: number) =>
	alpha == null ? `rgb(var(--${name}))` : `rgb(var(--${name}) / ${alpha})`;

/** Tema del editor con los tokens de diseño (oscuro y claro automáticos). */
const webwizTheme = EditorView.theme({
	"&": {
		backgroundColor: v("surface"),
		color: v("text"),
		fontSize: "14px",
		height: "100%",
	},
	"&.cm-focused": { outline: "none" },
	".cm-scroller": {
		fontFamily: '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace',
		fontVariantLigatures: "none",
		lineHeight: "1.6",
	},
	".cm-content": { caretColor: v("accent"), padding: "10px 0" },
	".cm-cursor, .cm-dropCursor": { borderLeftColor: v("accent"), borderLeftWidth: "2px" },
	"&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
		backgroundColor: `${v("accent", 0.28)} !important`,
	},
	".cm-activeLine": { backgroundColor: v("accent", 0.06) },
	".cm-gutters": {
		backgroundColor: v("surface"),
		color: v("muted"),
		border: "none",
		borderRight: `1px solid ${v("border")}`,
	},
	".cm-activeLineGutter": { backgroundColor: v("accent", 0.08), color: v("text") },
	".cm-lineNumbers .cm-gutterElement": { padding: "0 10px 0 12px" },
	".cm-matchingBracket": { backgroundColor: v("accent", 0.2), outline: `1px solid ${v("accent", 0.5)}` },
	".cm-tooltip": {
		backgroundColor: v("surface-2"),
		color: v("text"),
		border: `1px solid ${v("border")}`,
		borderRadius: "10px",
		overflow: "hidden",
	},
	".cm-tooltip-autocomplete > ul > li[aria-selected]": { backgroundColor: v("accent-soft"), color: v("text") },
	".cm-completionDetail": { color: v("muted") },
	".cm-diagnostic-error": { borderLeftColor: v("warn") },
	".cm-diagnostic-warning": { borderLeftColor: v("accent") },
	".cm-lintRange-error": {
		backgroundImage: "none",
		textDecoration: `wavy underline ${v("warn")}`,
		textUnderlineOffset: "3px",
	},
	".cm-lint-marker-error": { content: "none" },
	".cm-panels": { backgroundColor: v("surface-2"), color: v("text") },
	".cm-foldPlaceholder": { backgroundColor: v("surface-2"), border: "none", color: v("muted") },
});

const webwizHighlight = HighlightStyle.define([
	{ tag: [t.comment, t.meta], color: v("muted"), fontStyle: "italic" },
	{ tag: [t.keyword, t.tagName, t.operatorKeyword, t.modifier], color: v("accent") },
	{ tag: [t.attributeName, t.propertyName, t.function(t.variableName), t.function(t.propertyName)], color: v("chart-4") },
	{ tag: [t.string, t.attributeValue, t.special(t.string), t.regexp], color: v("chart-3") },
	{ tag: [t.number, t.bool, t.null, t.atom, t.unit, t.color], color: v("warn") },
	{ tag: [t.className, t.typeName, t.definition(t.variableName)], color: v("text"), fontWeight: "600" },
	{ tag: [t.punctuation, t.operator, t.bracket, t.angleBracket], color: v("muted") },
	{ tag: t.invalid, color: v("warn") },
]);

const LINTERS = { html: lintHtml, css: lintCss, javascript: lintJs };

function languageExtension(lang: EditorLanguage) {
	if (lang === "css") return css();
	if (lang === "javascript") return javascript();
	return html({ autoCloseTags: true, matchClosingTags: true });
}

type Props = {
	value: string;
	onChange?: (value: string) => void;
	language: EditorLanguage;
	readOnly?: boolean;
	label: string;
	className?: string;
	minHeight?: string;
};

/**
 * Editor CodeMirror 6: resaltado, autocompletado, cierre de etiquetas y
 * errores de sintaxis marcados en su línea. Elegido frente a Monaco por peso
 * y soporte en móvil (WebView de Android).
 */
export default function CodeMirrorEditor({ value, onChange, language, readOnly = false, label, className = "", minHeight = "16rem" }: Props) {
	const extensions = useMemo(
		() => [
			languageExtension(language),
			syntaxHighlighting(webwizHighlight),
			webwizTheme,
			EditorView.lineWrapping,
			EditorView.contentAttributes.of({ "aria-label": label }),
			...(readOnly
				? []
				: [
						lintGutter(),
						linter(
							(view): Diagnostic[] =>
								LINTERS[language](view.state.doc.toString()).map((d) => ({ ...d })),
							{ delay: 350 },
						),
					]),
		],
		[language, readOnly, label],
	);

	return (
		<div className={`overflow-hidden rounded-lg border border-line ${readOnly ? "opacity-90" : ""} ${className}`}>
			<CodeMirror
				value={value}
				onChange={onChange}
				extensions={extensions}
				editable={!readOnly}
				readOnly={readOnly}
				theme="none"
				height="100%"
				minHeight={minHeight}
				style={{ height: "100%" }}
				basicSetup={{
					lineNumbers: true,
					foldGutter: true,
					highlightActiveLine: !readOnly,
					highlightActiveLineGutter: !readOnly,
					autocompletion: !readOnly,
					closeBrackets: !readOnly,
					bracketMatching: true,
					indentOnInput: true,
					tabSize: 2,
					searchKeymap: true,
				}}
			/>
		</div>
	);
}
