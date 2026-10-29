import { Fragment, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Bot, Check, FileCode2, MessageSquarePlus, RotateCcw, Send, Trash2, X } from "lucide-react";
import { REVIEWS, getReview } from "@/content/reviews";
import { useAuth } from "@/services/auth";
import { saveAttempt } from "@/services/challengeAttempts";
import { pushAnswer } from "@/services/learningSync";
import { LEVEL_LABEL } from "@/features/editor/languages";
import { conceptsForQuestion } from "@/features/learning/concepts";
import { useLearning } from "@/features/learning/store";
import { scoreReview, type ReviewComment, type ReviewOutcome } from "./scoring";
import { CATEGORY_LABEL, issueRange, parseDiff, type ReviewCategory, type ReviewSpec } from "./types";
import { markReviewDone } from "./progress";

export default function ReviewPage() {
	const { id } = useParams();
	const spec = id ? getReview(id) : undefined;
	if (!spec)
		return (
			<div className="space-y-3 p-6 text-center">
				<p>Revisión no encontrada.</p>
				<Link to="/revisiones" className="text-accent underline">
					Ver todas las revisiones
				</Link>
			</div>
		);
	return <Review key={spec.id} spec={spec} />;
}

const CATEGORIES = Object.keys(CATEGORY_LABEL) as ReviewCategory[];
const CAT_STYLE: Record<ReviewCategory, string> = {
	seguridad: "border-warn/60 text-warn",
	bug: "border-accent/60 text-accent",
	rendimiento: "border-line text-fg",
	accesibilidad: "border-line text-fg",
};

let nextId = 0;

function Review({ spec }: { spec: ReviewSpec }) {
	const navigate = useNavigate();
	const { user } = useAuth();
	const rows = useMemo(() => parseDiff(spec.diff), [spec]);
	const ranges = useMemo(() => spec.issues.map((i) => ({ issue: i, range: issueRange(rows, i) })), [spec, rows]);
	const [comments, setComments] = useState<ReviewComment[]>([]);
	const [editing, setEditing] = useState<number | null>(null);
	const [draftCat, setDraftCat] = useState<ReviewCategory>("bug");
	const [draftText, setDraftText] = useState("");
	const [outcome, setOutcome] = useState<ReviewOutcome | null>(null);
	const startedAt = useRef(Date.now());
	const resultRef = useRef<HTMLHeadingElement>(null);
	const index = REVIEWS.findIndex((r) => r.id === spec.id);
	const next = REVIEWS[index + 1];

	const openEditor = (row: number) => {
		if (outcome) return;
		setEditing(row);
		setDraftText("");
	};
	const addComment = () => {
		if (editing === null) return;
		setComments((c) => [...c, { id: `c${nextId++}`, row: editing, category: draftCat, text: draftText.trim() }]);
		setEditing(null);
	};

	const submit = () => {
		const out = scoreReview(spec, comments);
		setOutcome(out);
		setEditing(null);
		markReviewDone(spec.id, out.score);
		// Cada fallo cuenta como una respuesta sobre sus conceptos (repaso espaciado)
		for (const issue of spec.issues) {
			const record = {
				questionId: `${spec.id}:${issue.id}`,
				chosen: issue.category,
				correct: out.found.some((f) => f.issueId === issue.id),
				confidence: "creo" as const,
				concepts: conceptsForQuestion({ concepts: [...issue.concepts, "ia-revision"] }),
			};
			const learned = useLearning.getState().recordAnswer(record);
			if (user) void pushAnswer(user.id, record, learned.cards, useLearning.getState().streak);
		}
		if (user) {
			void saveAttempt({
				userId: user.id,
				challengeId: spec.id,
				code: { "app.js": JSON.stringify(comments) },
				results: spec.issues.map((i) => ({
					name: i.title,
					passed: out.found.some((f) => f.issueId === i.id),
					message: out.found.some((f) => f.issueId === i.id) ? "Encontrado" : "No encontrado",
				})),
				hintsUsed: 0,
				durationMs: Date.now() - startedAt.current,
				score: out.score,
			});
		}
		requestAnimationFrame(() => resultRef.current?.focus());
	};

	const reset = () => {
		setComments([]);
		setOutcome(null);
		startedAt.current = Date.now();
	};

	const issueAt = (row: number) => ranges.find(({ range }) => row >= range[0] && row <= range[1])?.issue;
	const commentState = (c: ReviewComment) =>
		!outcome
			? null
			: outcome.found.some((f) => f.commentId === c.id)
				? "acierto"
				: outcome.wrongCategory.some((w) => w.commentId === c.id)
					? "categoria"
					: outcome.falsePositives.includes(c.id)
						? "falso"
						: "repetido";

	return (
		<section className="mx-auto w-full max-w-5xl px-4 pb-32 pt-6 sm:px-6">
			<Link to="/revisiones" className="inline-flex min-h-8 items-center gap-1 font-mono text-xs text-muted hover:text-fg">
				<ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Revisiones · {index + 1} de {REVIEWS.length}
			</Link>
			<header className="mt-2 rounded-2xl border border-line bg-surface p-4">
				<p className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted">
					<span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent-soft px-2 py-0.5 font-semibold text-accent">
						<Bot className="h-3.5 w-3.5" aria-hidden="true" /> Generado por IA
					</span>
					<span>{LEVEL_LABEL[spec.difficulty]}</span>
					<span>· {spec.issues.length} fallos ocultos</span>
				</p>
				<h1 className="mt-2 font-display text-xl font-bold sm:text-2xl">{spec.title}</h1>
				<p className="mt-1 text-sm text-muted">{spec.description}</p>
				<p className="mt-3 text-sm">
					Pulsa el número de una línea para comentarla y elige la categoría del problema. Acertar exige la línea (±1) y la categoría;
					los comentarios que no señalan un fallo restan.
				</p>
			</header>

			{outcome && <Outcome spec={spec} outcome={outcome} headingRef={resultRef} />}

			<div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
				<p className="flex items-center gap-2 border-b border-line px-3 py-2 font-mono text-xs text-muted">
					<FileCode2 className="h-3.5 w-3.5" aria-hidden="true" /> {spec.file}
				</p>
				<div className="overflow-x-auto" tabIndex={0} role="region" aria-label={`Diff de ${spec.file}`}>
					<table className="w-full border-collapse font-mono text-[0.8rem] leading-6">
						<tbody>
							{rows.map((r) => {
								const rowComments = comments.filter((c) => c.row === r.n);
								const issue = outcome ? issueAt(r.n) : undefined;
								const hit = issue && outcome?.found.some((f) => f.issueId === issue.id);
								return (
									<Fragment key={r.n}>
										<tr
											className={`${r.kind === "+" ? "bg-accent/[0.06]" : r.kind === "-" ? "bg-warn/[0.07]" : ""} ${
												issue ? (hit ? "outline outline-1 -outline-offset-1 outline-accent" : "outline outline-1 -outline-offset-1 outline-warn") : ""
											}`}
										>
											<td className="w-12 select-none border-r border-line p-0 text-right align-top">
												<button
													type="button"
													onClick={() => openEditor(r.n)}
													disabled={!!outcome}
													aria-label={`Comentar la línea ${r.n}`}
													className="group flex min-h-6 w-full items-center justify-end gap-1 px-2 text-muted hover:bg-accent-soft hover:text-fg disabled:hover:bg-transparent"
												>
													<MessageSquarePlus className="h-3 w-3 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true" />
													{r.n}
												</button>
											</td>
											<td className={`w-5 select-none text-center ${r.kind === "+" ? "text-accent" : r.kind === "-" ? "text-warn" : "text-muted"}`} aria-hidden="true">
												{r.kind === " " ? "" : r.kind}
											</td>
											<td className="whitespace-pre pr-4">{r.text || " "}</td>
										</tr>
										{rowComments.map((c) => {
											const st = commentState(c);
											return (
												<tr key={c.id}>
													<td colSpan={3} className="border-y border-line bg-surface2 px-3 py-2 font-sans">
														<div className="flex items-start gap-2 text-sm">
															<span className={`rounded-full border px-2 py-0.5 font-mono text-[0.7rem] font-semibold uppercase ${CAT_STYLE[c.category]}`}>
																{CATEGORY_LABEL[c.category]}
															</span>
															<p className="min-w-0 flex-1">{c.text || <span className="text-muted">(sin texto)</span>}</p>
															{st === "acierto" && <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent"><Check className="h-4 w-4" aria-hidden="true" />Acierto</span>}
															{st === "categoria" && <span className="text-xs font-semibold text-warn">Línea correcta, otra categoría</span>}
															{st === "falso" && <span className="inline-flex items-center gap-1 text-xs font-semibold text-warn"><X className="h-4 w-4" aria-hidden="true" />Falso positivo</span>}
															{!outcome && (
																<button
																	type="button"
																	onClick={() => setComments((all) => all.filter((x) => x.id !== c.id))}
																	aria-label={`Borrar comentario de la línea ${c.row}`}
																	className="flex min-h-8 min-w-8 items-center justify-center rounded text-muted hover:text-fg"
																>
																	<Trash2 className="h-4 w-4" aria-hidden="true" />
																</button>
															)}
														</div>
													</td>
												</tr>
											);
										})}
										{editing === r.n && (
											<tr>
												<td colSpan={3} className="border-y border-accent/50 bg-accent-softer p-3 font-sans">
													<fieldset>
														<legend className="text-sm font-semibold">Comentario en la línea {r.n}</legend>
														<div role="radiogroup" aria-label="Categoría" className="mt-2 flex flex-wrap gap-1.5">
															{CATEGORIES.map((cat) => (
																<button
																	key={cat}
																	type="button"
																	role="radio"
																	aria-checked={draftCat === cat}
																	onClick={() => setDraftCat(cat)}
																	className={`min-h-9 rounded-full border px-3 text-xs font-semibold ${
																		draftCat === cat ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface text-fg hover:border-accent/60"
																	}`}
																>
																	{CATEGORY_LABEL[cat]}
																</button>
															))}
														</div>
														<label htmlFor="review-text" className="sr-only">
															Explica el problema
														</label>
														<textarea
															id="review-text"
															autoFocus
															value={draftText}
															onChange={(e) => setDraftText(e.target.value)}
															onKeyDown={(e) => {
																if ((e.ctrlKey || e.metaKey) && e.key === "Enter") addComment();
																if (e.key === "Escape") setEditing(null);
															}}
															rows={2}
															placeholder="¿Qué problema ves? (opcional)"
															className="mt-2 w-full rounded-lg border border-line bg-surface p-2 text-sm"
														/>
														<div className="mt-2 flex gap-2">
															<button type="button" onClick={addComment} className="min-h-touch rounded-md bg-accent px-4 text-sm font-semibold text-accent-fg hover:bg-accent/90">
																Añadir comentario
															</button>
															<button type="button" onClick={() => setEditing(null)} className="min-h-touch rounded-md px-3 text-sm text-muted hover:text-fg">
																Cancelar
															</button>
														</div>
													</fieldset>
												</td>
											</tr>
										)}
									</Fragment>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>

			<div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur">
				<div className="mx-auto flex w-full max-w-5xl items-center gap-3">
					<p className="flex-1 text-sm text-muted" aria-live="polite">
						{outcome ? `${outcome.score} de ${outcome.max} puntos` : `${comments.length} ${comments.length === 1 ? "comentario" : "comentarios"}`}
					</p>
					{outcome ? (
						<>
							<button type="button" onClick={reset} className="inline-flex min-h-12 items-center gap-2 rounded-lg px-3 text-muted hover:text-fg">
								<RotateCcw className="h-4 w-4" aria-hidden="true" /> Repetir
							</button>
							{next && (
								<button
									type="button"
									onClick={() => navigate(`/revisiones/${next.id}`)}
									className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-accent px-5 font-semibold text-accent-fg hover:bg-accent/90"
								>
									Siguiente revisión <ArrowRight className="h-4 w-4" aria-hidden="true" />
								</button>
							)}
						</>
					) : (
						<button
							type="button"
							onClick={submit}
							disabled={comments.length === 0}
							className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-accent px-5 font-semibold text-accent-fg hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-surface2 disabled:text-muted"
						>
							<Send className="h-4 w-4" aria-hidden="true" /> Enviar revisión
						</button>
					)}
				</div>
			</div>
		</section>
	);
}

function Outcome({ spec, outcome, headingRef }: { spec: ReviewSpec; outcome: ReviewOutcome; headingRef: React.RefObject<HTMLHeadingElement | null> }) {
	return (
		<section aria-labelledby="review-result" className="mt-4 rounded-2xl border border-line bg-surface p-4">
			<h2 id="review-result" ref={headingRef} tabIndex={-1} className="font-display text-lg font-bold outline-none">
				Encontraste {outcome.found.length} de {spec.issues.length} fallos · {outcome.score}/{outcome.max} puntos
			</h2>
			{outcome.falsePositives.length > 0 && (
				<p className="text-sm text-warn">
					{outcome.falsePositives.length} {outcome.falsePositives.length === 1 ? "comentario no señalaba" : "comentarios no señalaban"} ningún fallo (−25 cada uno).
				</p>
			)}
			<ul className="mt-3 space-y-3">
				{spec.issues.map((i) => {
					const ok = outcome.found.some((f) => f.issueId === i.id);
					const partial = outcome.wrongCategory.some((w) => w.issueId === i.id);
					return (
						<li key={i.id} className={`rounded-xl border p-3 ${ok ? "border-accent/50 bg-accent-softer" : "border-warn/50 bg-warn-soft"}`}>
							<p className="flex flex-wrap items-center gap-2 text-sm">
								<span className={`font-semibold ${ok ? "text-accent" : "text-warn"}`}>{ok ? "Encontrado" : partial ? "Casi: otra categoría" : "Se te escapó"}</span>
								<span className={`rounded-full border px-2 py-0.5 font-mono text-[0.7rem] font-semibold uppercase ${CAT_STYLE[i.category]}`}>{CATEGORY_LABEL[i.category]}</span>
							</p>
							<p className="mt-1 font-semibold">{i.title}</p>
							<p className="mt-0.5 text-sm leading-relaxed">{i.explanation}</p>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
