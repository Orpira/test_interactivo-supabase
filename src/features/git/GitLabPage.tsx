import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, GitBranch, Lightbulb, RotateCcw, Terminal } from "lucide-react";
import { GIT_SCENARIOS, type GitScenario } from "@/content/topics/git";
import { LEVEL_LABEL } from "@/features/editor/languages";
import { useAuth } from "@/services/auth";
import { pushAnswer } from "@/services/learningSync";
import { conceptsForQuestion } from "@/features/learning/concepts";
import { useLearning } from "@/features/learning/store";
import { currentBranch, headCommitId, run, type Repo } from "./minigit";
import { markGitSolved } from "./progress";

export default function GitLabPage() {
	const { id } = useParams();
	const scenario = GIT_SCENARIOS.find((s) => s.id === id);
	if (!scenario)
		return (
			<div className="space-y-3 p-6 text-center">
				<p>Escenario no encontrado.</p>
				<Link to="/git" className="text-accent underline">
					Ver todos
				</Link>
			</div>
		);
	return <Lab key={scenario.id} scenario={scenario} />;
}

type Line = { kind: "in" | "out" | "err"; text: string };

function Lab({ scenario }: { scenario: GitScenario }) {
	const navigate = useNavigate();
	const { user } = useAuth();
	const [repo, setRepo] = useState<Repo>(() => scenario.setup());
	const [lines, setLines] = useState<Line[]>([{ kind: "out", text: 'Escribe "help" para ver los comandos. Empieza por git status o git log --oneline --all.' }]);
	const [input, setInput] = useState("");
	const [history, setHistory] = useState<string[]>([]);
	const [histPos, setHistPos] = useState(-1);
	const [hints, setHints] = useState(0);
	const [version, setVersion] = useState(0);
	const [solved, setSolved] = useState(false);
	const endRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const index = GIT_SCENARIOS.indexOf(scenario);
	const next = GIT_SCENARIOS[index + 1];

	const status = useMemo(() => scenario.check(repo), [repo, scenario, version]); // eslint-disable-line react-hooks/exhaustive-deps
	const graph = useMemo(() => run(structuredClone(repo), "git log --oneline --all").output, [repo, version]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		endRef.current?.scrollIntoView?.({ block: "nearest" });
	}, [lines]);

	useEffect(() => {
		if (status === true && !solved) {
			setSolved(true);
			markGitSolved(scenario.id);
			const record = { questionId: scenario.id, chosen: "git", correct: true, confidence: "creo" as const, concepts: conceptsForQuestion({ concepts: scenario.concepts }) };
			const learned = useLearning.getState().recordAnswer(record);
			if (user) void pushAnswer(user.id, record, learned.cards, useLearning.getState().streak);
		}
	}, [status, solved, scenario, user]);

	const submit = () => {
		const cmd = input.trim();
		if (!cmd) return;
		if (cmd === "clear") {
			setLines([]);
		} else {
			// run() modifica el repositorio en memoria; "version" fuerza el recálculo
			const res = run(repo, cmd);
			const added: Line[] = [{ kind: "in", text: cmd }];
			if (res.output) added.push({ kind: res.error ? "err" : "out", text: res.output });
			setLines((l) => [...l, ...added].slice(-300));
			setVersion((v) => v + 1);
		}
		setHistory((h) => [cmd, ...h].slice(0, 50));
		setHistPos(-1);
		setInput("");
	};

	const restart = () => {
		setRepo(scenario.setup());
		setLines([{ kind: "out", text: "Escenario reiniciado." }]);
		setSolved(false);
		setVersion((v) => v + 1);
		inputRef.current?.focus();
	};

	const branch = currentBranch(repo) ?? `HEAD ${headCommitId(repo)}`;

	return (
		<section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">
			<Link to="/git" className="inline-flex min-h-8 items-center gap-1 font-mono text-xs text-muted hover:text-fg">
				<ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Git en escenarios · {index + 1} de {GIT_SCENARIOS.length}
			</Link>
			<div className="mt-2 flex flex-wrap items-center gap-2">
				<h1 className="font-display text-xl font-bold sm:text-2xl">{scenario.title}</h1>
				<span className="rounded-full border border-line px-2.5 py-0.5 font-mono text-xs text-muted">{LEVEL_LABEL[scenario.difficulty]}</span>
			</div>
			<p className="mt-1 max-w-3xl">{scenario.instructions}</p>
			{hints > 0 && (
				<ul className="mt-3 space-y-1 rounded-lg border border-accent/30 bg-accent-soft p-3 text-sm">
					{scenario.hints.slice(0, hints).map((h) => (
						<li key={h} className="font-mono">
							💡 {h}
						</li>
					))}
				</ul>
			)}

			<div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
				<div className="flex min-h-[24rem] flex-col overflow-hidden rounded-xl border border-line bg-[#0d1117] text-[#e6edf3]">
					<p className="flex items-center gap-2 border-b border-white/10 px-3 py-2 font-mono text-xs text-[#8b949e]">
						<Terminal className="h-3.5 w-3.5" aria-hidden="true" /> Terminal · repositorio en memoria
					</p>
					<div role="log" aria-live="polite" aria-label="Salida del terminal" className="min-h-0 flex-1 overflow-auto p-3 font-mono text-sm" onClick={() => inputRef.current?.focus()}>
						{lines.map((l, i) => (
							<pre key={i} className={`whitespace-pre-wrap break-words ${l.kind === "in" ? "text-[#7aa2ff]" : l.kind === "err" ? "text-[#ffa657]" : ""}`}>
								{l.kind === "in" ? `$ ${l.text}` : l.text}
							</pre>
						))}
						<div ref={endRef} />
					</div>
					<form
						className="flex items-center gap-2 border-t border-white/10 px-3 py-2 font-mono text-sm"
						onSubmit={(e) => {
							e.preventDefault();
							submit();
						}}
					>
						<label htmlFor="git-input" className="shrink-0 text-[#56d3c8]">
							({branch}) $<span className="sr-only"> comando</span>
						</label>
						<input
							id="git-input"
							ref={inputRef}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "ArrowUp" && history.length) {
									e.preventDefault();
									const p = Math.min(histPos + 1, history.length - 1);
									setHistPos(p);
									setInput(history[p]);
								} else if (e.key === "ArrowDown") {
									e.preventDefault();
									const p = Math.max(histPos - 1, -1);
									setHistPos(p);
									setInput(p === -1 ? "" : history[p]);
								}
							}}
							autoComplete="off"
							autoCapitalize="off"
							spellCheck={false}
							autoFocus
							className="min-w-0 flex-1 bg-transparent text-[#e6edf3] outline-none"
						/>
					</form>
				</div>

				<aside className="space-y-3">
					<div className={`rounded-xl border p-3 ${status === true ? "border-accent/60 bg-accent-softer" : "border-line bg-surface"}`} aria-live="polite">
						{status === true ? (
							<p className="flex items-center gap-1.5 font-semibold text-accent">
								<CheckCircle2 className="h-5 w-5" aria-hidden="true" /> ¡Resuelto!
							</p>
						) : (
							<p className="text-sm">
								<span className="font-semibold">Aún no:</span> <span className="text-muted">{status}</span>
							</p>
						)}
						{status === true && next && (
							<button
								type="button"
								onClick={() => navigate(`/git/${next.id}`)}
								className="mt-2 inline-flex min-h-touch items-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-accent-fg hover:bg-accent/90"
							>
								Siguiente escenario <ArrowRight className="h-4 w-4" aria-hidden="true" />
							</button>
						)}
					</div>
					<div className="rounded-xl border border-line bg-surface p-3">
						<h2 className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-muted">
							<GitBranch className="h-3.5 w-3.5" aria-hidden="true" /> Historia
						</h2>
						<pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap font-mono text-xs" tabIndex={0} aria-label="git log --oneline --all">
							{graph}
						</pre>
					</div>
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={() => setHints((h) => Math.min(h + 1, scenario.hints.length))}
							disabled={hints >= scenario.hints.length}
							className="inline-flex min-h-touch items-center gap-2 rounded-md border border-line bg-surface2 px-3 text-sm font-medium hover:border-accent/60 disabled:opacity-50"
						>
							<Lightbulb className="h-4 w-4" aria-hidden="true" /> Pista ({scenario.hints.length - hints})
						</button>
						<button type="button" onClick={restart} className="inline-flex min-h-touch items-center gap-1.5 px-2 text-sm text-muted hover:text-fg">
							<RotateCcw className="h-4 w-4" aria-hidden="true" /> Reiniciar
						</button>
					</div>
				</aside>
			</div>
		</section>
	);
}
