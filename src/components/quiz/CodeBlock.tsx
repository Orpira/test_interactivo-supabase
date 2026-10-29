import { useEffect, useState } from "react";
import { highlight } from "@/services/highlighter";

type Props = {
	code: string;
	lang: string | null;
	/** En línea: dentro de una opción de respuesta, sin marco */
	inline?: boolean;
	className?: string;
};

/**
 * Código resaltado con Shiki. Mientras carga el resaltador se muestra el código
 * sin colores, así nunca hay huecos ni saltos de diseño.
 */
export default function CodeBlock({ code, lang, inline = false, className = "" }: Props) {
	const [html, setHtml] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setHtml(null);
		if (!lang) return;
		highlight(code, lang)
			.then((out) => !cancelled && setHtml(out))
			.catch(() => {
				// lenguaje no soportado: se queda en texto plano
			});
		return () => {
			cancelled = true;
		};
	}, [code, lang]);

	if (inline) {
		return html ? (
			<span
				className={`font-mono text-[0.95em] [&_.shiki]:inline [&_code]:inline [&_pre]:inline ${className}`}
				// Shiki escapa el código del usuario: el HTML resultante es seguro
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		) : (
			<code className={`font-mono text-[0.95em] ${className}`}>{code}</code>
		);
	}

	return (
		<div
			className={`overflow-x-auto rounded-lg border border-line bg-surface p-4 text-left font-mono text-sm leading-relaxed ${className}`}
		>
			{html ? (
				<div dangerouslySetInnerHTML={{ __html: html }} />
			) : (
				<pre className="whitespace-pre-wrap break-words">
					<code>{code}</code>
				</pre>
			)}
		</div>
	);
}
