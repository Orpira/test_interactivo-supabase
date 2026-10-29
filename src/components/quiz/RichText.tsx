import { Fragment } from "react";
import CodeBlock from "./CodeBlock";
import { parseRich } from "./richText";

/** Texto con `código en línea` y bloques ``` resaltados. */
export default function RichText({
	text,
	lang,
	className = "",
	headingClassName = "",
	firstAsHeading = false,
}: {
	text: string;
	lang: string | null;
	className?: string;
	headingClassName?: string;
	/** El primer párrafo se renderiza como <h1> (enunciado de la pregunta) */
	firstAsHeading?: boolean;
}) {
	const segments = parseRich(text, lang);
	const firstText = segments.findIndex((s) => s.type === "text");
	return (
		<div className={`space-y-3 ${className}`}>
			{segments.map((seg, i) => {
				if (seg.type === "code")
					return <CodeBlock key={i} code={seg.code} lang={seg.lang} />;
				const Tag = firstAsHeading && i === firstText ? "h1" : "p";
				return (
					<Tag
						key={i}
						className={`whitespace-pre-line ${Tag === "h1" ? headingClassName : ""}`}
					>
						<InlineCode text={seg.text} />
					</Tag>
				);
			})}
		</div>
	);
}

export function InlineCode({ text }: { text: string }) {
	return (
		<>
			{text.split(/(`[^`\n]+`)/g).map((part, i) =>
				/^`[^`]+`$/.test(part) ? (
					<code
						key={i}
						className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-[0.9em] text-fg"
					>
						{part.slice(1, -1)}
					</code>
				) : (
					<Fragment key={i}>{part}</Fragment>
				),
			)}
		</>
	);
}
