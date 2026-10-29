import { motion, useReducedMotion } from "framer-motion";
import RichText from "@/components/quiz/RichText";
import CodeBlock from "@/components/quiz/CodeBlock";
import {
	looksLikeCode,
	OPTION_LETTERS,
	stripBackticks,
} from "@/components/quiz/richText";


type QuestionCardProps = {
	question: string;
	/** Código adicional de la pregunta (campo `code`), si existe */
	code?: string;
	options: string[];
	lang: string | null;
	selected: string | null;
	/** true tras pulsar "Comprobar": se muestran correcta / incorrecta */
	checked: boolean;
	correctAnswer: string;
	onSelect: (option: string) => void;
};

type OptionState = "normal" | "selected" | "correct" | "wrong" | "dimmed";

const STATE_STYLES: Record<OptionState, { box: string; letter: string }> = {
	normal: {
		box: "border-line bg-surface hover:border-accent/60",
		letter: "bg-surface2 text-fg",
	},
	selected: {
		box: "border-accent bg-accent-soft",
		letter: "bg-accent text-accent-fg",
	},
	correct: {
		box: "border-accent bg-accent-softer",
		letter: "bg-accent text-accent-fg",
	},
	wrong: {
		box: "border-warn bg-warn-soft",
		letter: "bg-warn text-warn-fg",
	},
	dimmed: {
		box: "border-line bg-surface opacity-55",
		letter: "bg-surface2 text-fg",
	},
};

function stateOf(
	option: string,
	selected: string | null,
	checked: boolean,
	correct: string,
): OptionState {
	if (!checked) return option === selected ? "selected" : "normal";
	if (option === correct) return "correct";
	if (option === selected) return "wrong";
	return "dimmed";
}

/**
 * Enunciado + opciones. Las opciones son un grupo de radio accesible:
 * se eligen con clic, con 1-4 / A-D (atajos en QuizRunner) o con flechas.
 */
export default function QuestionCard({
	question,
	code,
	options,
	lang,
	selected,
	checked,
	correctAnswer,
	onSelect,
}: QuestionCardProps) {
	const reduceMotion = useReducedMotion();

	return (
		<div className="w-full">
			<RichText
				text={question}
				lang={lang}
				firstAsHeading
				headingClassName="font-display text-xl font-bold leading-snug sm:text-[1.375rem]"
				className="text-fg"
			/>
			{code && <CodeBlock code={code} lang={lang} className="mt-4" />}

			<div
				role="radiogroup"
				aria-label="Opciones de respuesta"
				className="mt-6 flex flex-col gap-3"
			>
				{options.map((option, idx) => {
					const state = stateOf(option, selected, checked, correctAnswer);
					const style = STATE_STYLES[state];
					const isCode = looksLikeCode(option);
					const animate =
						reduceMotion || !checked
							? undefined
							: state === "correct"
								? { scale: [1, 1.025, 1] }
								: state === "wrong"
									? { x: [0, -7, 7, -4, 4, 0] }
									: undefined;

					return (
						<motion.button
							key={option}
							type="button"
							role="radio"
							aria-checked={option === selected}
							aria-disabled={checked}
							tabIndex={
								option === selected || (!selected && idx === 0) ? 0 : -1
							}
							onClick={() => !checked && onSelect(option)}
							onKeyDown={(e) => {
								if (checked) return;
								const delta =
									e.key === "ArrowDown" || e.key === "ArrowRight"
										? 1
										: e.key === "ArrowUp" || e.key === "ArrowLeft"
											? -1
											: 0;
								if (!delta) return;
								e.preventDefault();
								const nextIdx = (idx + delta + options.length) % options.length;
								onSelect(options[nextIdx]);
								const group = e.currentTarget.parentElement;
								(group?.children[nextIdx] as HTMLElement | undefined)?.focus();
							}}
							animate={animate}
							transition={{ duration: state === "wrong" ? 0.4 : 0.35 }}
							className={`group flex min-h-[52px] w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-colors ${style.box} ${checked ? "cursor-default" : "cursor-pointer"}`}
						>
							<span
								aria-hidden="true"
								className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold transition-colors ${style.letter}`}
							>
								{OPTION_LETTERS[idx]}
							</span>
							<span className="flex-1 break-words text-[0.95rem] leading-snug sm:text-base">
								{isCode ? (
									<CodeBlock code={stripBackticks(option)} lang={lang} inline />
								) : (
									option
								)}
							</span>
							{state === "correct" && (
								<span className="shrink-0 font-mono text-xs font-semibold uppercase tracking-wide text-accent">
									Correcta
								</span>
							)}
							{state === "wrong" && (
								<span className="shrink-0 font-mono text-xs font-semibold uppercase tracking-wide text-warn">
									Tu respuesta
								</span>
							)}
						</motion.button>
					);
				})}
			</div>
		</div>
	);
}
