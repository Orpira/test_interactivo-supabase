import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { QUIZ_CATEGORIES } from "./navData";
import { useDismiss } from "./useDismiss";

/** Desplegable de Quizzes con las 4 áreas. */
export default function QuizMenu({
	active,
	onSelect,
}: {
	active: boolean;
	onSelect: (key: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const reduceMotion = useReducedMotion();
	useDismiss(open, ref, () => setOpen(false), buttonRef);

	return (
		<div ref={ref} className="relative">
			<button
				ref={buttonRef}
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				aria-controls="quiz-menu"
				className={`relative flex min-h-10 items-center gap-1 rounded-full px-3.5 text-sm font-medium transition-colors ${
					active || open ? "text-fg" : "text-muted hover:text-fg"
				}`}
			>
				{active && <ActivePill />}
				<span className="relative">Quizzes</span>
				<ChevronDown
					className={`relative h-4 w-4 transition ${open ? "rotate-180" : ""}`}
					aria-hidden="true"
				/>
			</button>
			<AnimatePresence>
				{open && (
					<motion.div
						id="quiz-menu"
						initial={reduceMotion ? false : { opacity: 0, y: -6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -6 }}
						transition={{ duration: 0.14 }}
						className="absolute left-1/2 mt-3 w-[26rem] -translate-x-1/2 rounded-2xl border border-line bg-surface p-2 shadow-[0_20px_50px_-15px_rgb(0_0_0/0.5)]"
					>
						<p className="px-3 pb-1 pt-2 font-mono text-[0.65rem] font-semibold uppercase tracking-widest text-muted">
							Elige un área
						</p>
						<ul className="grid grid-cols-2 gap-1">
							{QUIZ_CATEGORIES.map(({ key, label, desc, icon: Icon }) => (
								<li key={key}>
									<button
										type="button"
										onClick={() => {
											setOpen(false);
											onSelect(key);
										}}
										className="group flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-surface2"
									>
										<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface2 text-accent transition group-hover:border-accent/50 group-hover:bg-accent-soft">
											<Icon className="h-5 w-5" aria-hidden="true" />
										</span>
										<span>
											<span className="block text-sm font-semibold">
												{label}
											</span>
											<span className="block text-xs leading-snug text-muted">
												{desc}
											</span>
										</span>
									</button>
								</li>
							))}
						</ul>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

/** Píldora que se desliza hasta el enlace activo (layoutId compartido). */
export function ActivePill() {
	return (
		<motion.span
			layoutId="nav-active-pill"
			className="absolute inset-0 rounded-full border border-accent/30 bg-accent-soft"
			transition={{ type: "spring", stiffness: 420, damping: 34 }}
		/>
	);
}
