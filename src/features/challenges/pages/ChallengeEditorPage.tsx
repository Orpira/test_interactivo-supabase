import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Group, Panel, Separator } from "react-resizable-panels";
import {
	ArrowLeft,
	Code2,
	Eye,
	FlaskConical,
	Lightbulb,
	Lock,
	Play,
	RotateCcw,
	Save,
} from "lucide-react";
import { useChallengeStore } from "@/store/challengeStore";
import { useAuth } from "@/services/auth";
import { saveAttempt } from "@/services/challengeAttempts";
import CodeMirrorEditor from "@/features/editor/CodeMirrorEditor";
import { LEVEL_LABEL, languageOfFile } from "@/features/editor/languages";
import { InlineCode } from "@/components/quiz/RichText";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { FILE_NAMES, type ChallengeSpec, type FileName, type TestResult } from "../engine/types";
import { markChallengeSolved } from "../progress";
import { useDraft } from "../workspace/useDraft";
import { useLiveTests } from "../workspace/useLiveTests";
import { useMediaQuery } from "../workspace/useMediaQuery";
import ConsolePanel, { type ConsoleEntry } from "../workspace/ConsolePanel";
import PreviewFrame from "../workspace/PreviewFrame";
import TestsPanel from "../workspace/TestsPanel";

export default function ChallengeEditorPage() {
	const { id } = useParams();
	const { challenges, loaded, fetchChallenges } = useChallengeStore();

	useEffect(() => {
		void fetchChallenges();
	}, [fetchChallenges]);

	const challenge = challenges.find((c) => c.id === id);
	if (!challenge) {
		return loaded ? (
			<div className="space-y-3 p-6 text-center">
				<p>Reto no encontrado.</p>
				<Link to="/editor" className="text-accent underline">
					Ver todos los retos
				</Link>
			</div>
		) : (
			<p className="p-6 text-center text-muted">Cargando reto...</p>
		);
	}
	return <ChallengeWorkspace key={challenge.id} challenge={challenge} all={challenges} />;
}

type MobileTab = "codigo" | "vista" | "tests";

function ChallengeWorkspace({ challenge, all }: { challenge: ChallengeSpec; all: ChallengeSpec[] }) {
	const navigate = useNavigate();
	const { user } = useAuth();
	const desktop = useMediaQuery("(min-width: 768px)");
	const draft = useDraft(challenge);
	const { files, setFile, hintsShown, setHintsShown } = draft;
	const { results, running, runs, runNow } = useLiveTests(files, challenge.tests, challenge.run);
	const previewOptions = useMemo(() => (challenge.run?.network ? { network: challenge.run.network } : undefined), [challenge]);

	const visibleFiles = FILE_NAMES.filter((f) => challenge.editable.includes(f) || challenge.files[f].trim());
	const readOnlyFiles = visibleFiles.filter((f) => !challenge.editable.includes(f));
	const [activeFile, setActiveFile] = useState<FileName>(challenge.editable[0]);
	const [mobileTab, setMobileTab] = useState<MobileTab>("codigo");
	const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
	const [confirmReset, setConfirmReset] = useState(false);
	const startedAt = useRef(Date.now());
	const savedPass = useRef(false);

	const siblings = all.filter((c) => c.category === challenge.category);
	const index = siblings.findIndex((c) => c.id === challenge.id);
	const next = siblings[index + 1];
	const passedAll = !!results && results.length > 0 && results.every((r) => r.passed);
	const passedCount = results?.filter((r) => r.passed).length ?? 0;

	const record = useCallback(
		(res: TestResult[]) => {
			if (!user) return;
			void saveAttempt({
				userId: user.id,
				challengeId: challenge.id,
				code: Object.fromEntries(challenge.editable.map((f) => [f, files[f]])),
				results: res,
				hintsUsed: hintsShown,
				durationMs: Date.now() - startedAt.current,
			});
		},
		[user, challenge, files, hintsShown],
	);

	// Al superarlo por primera vez (también con los tests en vivo) se registra
	useEffect(() => {
		if (passedAll && !savedPass.current && results) {
			savedPass.current = true;
			markChallengeSolved(challenge.id);
			record(results);
		}
	}, [passedAll, results, challenge.id, record]);

	const runAndRecord = useCallback(async () => {
		const res = await runNow();
		if (!res.every((r) => r.passed)) record(res);
		if (!desktop) setMobileTab("tests");
	}, [runNow, record, desktop]);

	// Ctrl/Cmd + Enter: ejecutar y registrar el intento
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
				e.preventDefault();
				void runAndRecord();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [runAndRecord]);

	const onConsole = useCallback(
		(entry: ConsoleEntry) => setConsoleEntries((prev) => [...prev.slice(-199), entry]),
		[],
	);
	const clearConsole = useCallback(() => setConsoleEntries([]), []);
	const goNext = next ? () => navigate(`/editor/${next.category}/${next.id}`) : undefined;

	// ---------- piezas reutilizadas en escritorio y móvil
	const fileTabs = (
		<div role="tablist" aria-label="Archivos" className="flex shrink-0 gap-1 overflow-x-auto border-b border-line px-1">
			{visibleFiles.map((f) => {
				const editable = challenge.editable.includes(f);
				const active = activeFile === f;
				return (
					<button
						key={f}
						type="button"
						role="tab"
						aria-selected={active}
						aria-controls="panel-codigo"
						onClick={() => setActiveFile(f)}
						className={`-mb-px inline-flex min-h-touch shrink-0 items-center gap-1.5 border-b-2 px-3 font-mono text-sm ${
							active ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg"
						}`}
					>
						{f}
						{!editable && <Lock className="h-3.5 w-3.5" aria-label="solo lectura" />}
					</button>
				);
			})}
		</div>
	);

	const hintStrip = hintsShown > 0 && (
		<div className="shrink-0 border-b border-accent/30 bg-accent-soft px-3 py-2 text-sm" aria-live="polite">
			<span className="font-mono text-xs font-semibold text-accent">
				PISTA {hintsShown}/{challenge.hints.length}
			</span>
			<p className="mt-0.5">
				<InlineCode text={challenge.hints[hintsShown - 1]} />
			</p>
		</div>
	);

	const editor = (
		<div id="panel-codigo" role="tabpanel" className="min-h-0 flex-1 p-2">
			<CodeMirrorEditor
				key={activeFile}
				value={files[activeFile]}
				onChange={(value) => setFile(activeFile, value)}
				language={languageOfFile(activeFile)}
				readOnly={!challenge.editable.includes(activeFile)}
				label={`Editor de ${activeFile}${challenge.editable.includes(activeFile) ? "" : " (solo lectura)"}`}
				className="h-full"
				minHeight="100%"
			/>
		</div>
	);

	const editorFooter = (
		<div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-line px-2 py-2">
			<button
				type="button"
				onClick={() => void runAndRecord()}
				disabled={running}
				className="inline-flex min-h-touch items-center gap-2 rounded-md bg-accent px-4 font-semibold text-accent-fg hover:bg-accent/90 disabled:opacity-60"
			>
				<Play className="h-4 w-4" aria-hidden="true" /> Ejecutar
				<kbd aria-hidden="true" className="hidden rounded border border-current px-1 font-mono text-[0.7rem] lg:inline">
					Ctrl+Enter
				</kbd>
			</button>
			<button
				type="button"
				onClick={() => setHintsShown((n) => Math.min(n + 1, challenge.hints.length))}
				disabled={hintsShown >= challenge.hints.length}
				className="inline-flex min-h-touch items-center gap-2 rounded-md border border-line bg-surface2 px-3 font-medium hover:border-accent/60 disabled:opacity-50"
			>
				<Lightbulb className="h-4 w-4" aria-hidden="true" /> Pista ({challenge.hints.length - hintsShown})
			</button>
			<button
				type="button"
				onClick={() => setConfirmReset(true)}
				className="inline-flex min-h-touch items-center gap-1.5 rounded-md px-2 text-sm text-muted hover:text-fg"
			>
				<RotateCcw className="h-4 w-4" aria-hidden="true" /> Restablecer
			</button>
			<p className="ml-auto flex flex-wrap items-center gap-x-3 font-mono text-xs text-muted">
				{readOnlyFiles.length > 0 && <span>Solo lectura: {readOnlyFiles.join(", ")}</span>}
				<span>Ejecución {runs} · tests en vivo</span>
				{draft.savedAt && (
					<span className="inline-flex items-center gap-1" title="Borrador guardado en este dispositivo">
						<Save className="h-3 w-3" aria-hidden="true" /> guardado
					</span>
				)}
			</p>
		</div>
	);

	const preview = <PreviewFrame files={files} onConsole={onConsole} onReload={clearConsole} options={previewOptions} />;
	const consolePanel = <ConsolePanel entries={consoleEntries} onClear={clearConsole} />;
	const testsPanel = (
		<TestsPanel tests={challenge.tests} results={results} running={running} hintsShown={hintsShown} onNext={goNext} />
	);

	const header = (
		<header className="shrink-0 px-4 pb-3 pt-4 sm:px-6">
			<nav className="mb-1 flex items-center gap-2 font-mono text-xs text-muted" aria-label="Migas de pan">
				<Link to={`/editor?categoria=${challenge.category}`} className="inline-flex min-h-8 items-center gap-1 hover:text-fg">
					<ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Retos / {challenge.category.toUpperCase()}
				</Link>
				<span>
					· {index + 1} de {siblings.length}
				</span>
			</nav>
			<div className="flex flex-wrap items-center gap-2">
				<h1 className="text-xl font-bold sm:text-2xl">{challenge.title}</h1>
				<span className="rounded-full border border-line px-2.5 py-0.5 font-mono text-xs text-muted">
					{LEVEL_LABEL[challenge.difficulty]}
				</span>
				<span className="font-mono text-xs text-accent">{challenge.concepts.join(" · ")}</span>
			</div>
			<p className="mt-2 max-w-4xl text-sm leading-relaxed sm:text-base">
				<InlineCode text={challenge.instructions} />
			</p>
			{draft.restored && <p className="mt-1 text-xs text-muted">Se ha recuperado tu borrador guardado.</p>}
		</header>
	);

	const resetDialog = (
		<ConfirmDialog
			open={confirmReset}
			title="¿Restablecer el código?"
			description="Se perderán tus cambios y volverás al código inicial del reto."
			onClose={() => setConfirmReset(false)}
			actions={[
				{ label: "Cancelar", variant: "secondary", onClick: () => setConfirmReset(false) },
				{
					label: "Restablecer",
					variant: "primary",
					onClick: () => {
						draft.reset();
						setConfirmReset(false);
					},
				},
			]}
		/>
	);

	if (desktop) {
		return (
			<div className="flex h-[calc(100dvh-4.1rem)] min-h-[640px] flex-col">
				{header}
				<Group orientation="horizontal" className="min-h-0 flex-1 border-t border-line">
					<Panel defaultSize="50" minSize="30" className="flex min-w-0 flex-col bg-surface">
						{fileTabs}
						{hintStrip}
						{editor}
						{editorFooter}
					</Panel>
					<ResizeHandle orientation="horizontal" />
					<Panel defaultSize="50" minSize="25" className="min-w-0">
						<Group orientation="vertical">
							<Panel defaultSize="55" minSize="20" className="flex flex-col">
								<p className="shrink-0 border-b border-line bg-surface px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-muted">
									Vista previa
								</p>
								<div className="min-h-0 flex-1">{preview}</div>
							</Panel>
							<ResizeHandle orientation="vertical" />
							<Panel defaultSize="45" minSize="15" className="bg-surface">
								<Group orientation="horizontal">
									<Panel defaultSize="50" minSize="20">
										{consolePanel}
									</Panel>
									<ResizeHandle orientation="horizontal" />
									<Panel defaultSize="50" minSize="25">
										{testsPanel}
									</Panel>
								</Group>
							</Panel>
						</Group>
					</Panel>
				</Group>
				{resetDialog}
			</div>
		);
	}

	// ---------- Móvil: una vista a la vez y pestañas inferiores
	return (
		<div className="flex h-[calc(100dvh-4.1rem)] flex-col">
			<div className="min-h-0 flex-1 overflow-auto">
				{mobileTab === "codigo" && (
					<div className="flex h-full min-h-[480px] flex-col">
						{header}
						{fileTabs}
						{hintStrip}
						{editor}
						{editorFooter}
					</div>
				)}
				{mobileTab === "vista" && (
					<div className="flex h-full flex-col">
						<div className="min-h-[50%] flex-1">{preview}</div>
						<div className="h-[40%] border-t border-line bg-surface">{consolePanel}</div>
					</div>
				)}
				{mobileTab === "tests" && <div className="h-full bg-surface">{testsPanel}</div>}
			</div>
			<nav
				aria-label="Vistas del reto"
				className="grid shrink-0 grid-cols-3 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
			>
				{(
					[
						{ id: "codigo", label: "Código", icon: Code2 },
						{ id: "vista", label: "Vista", icon: Eye },
						{ id: "tests", label: results ? `Tests ${passedCount}/${results.length}` : "Tests", icon: FlaskConical },
					] as const
				).map(({ id, label, icon: Icon }) => (
					<button
						key={id}
						type="button"
						aria-current={mobileTab === id ? "page" : undefined}
						onClick={() => setMobileTab(id)}
						className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
							mobileTab === id
								? "text-accent"
								: id === "tests" && results && !passedAll
									? "text-warn"
									: "text-muted"
						}`}
					>
						<Icon className="h-5 w-5" aria-hidden="true" />
						{label}
					</button>
				))}
			</nav>
			{resetDialog}
		</div>
	);
}

function ResizeHandle({ orientation }: { orientation: "horizontal" | "vertical" }) {
	return (
		<Separator
			className={`group relative flex items-center justify-center bg-line transition-colors hover:bg-accent/60 data-[separator=active]:bg-accent ${
				orientation === "horizontal" ? "w-1.5 cursor-col-resize" : "h-1.5 cursor-row-resize"
			}`}
		>
			<span
				className={`rounded-full bg-muted/50 group-hover:bg-accent ${orientation === "horizontal" ? "h-8 w-0.5" : "h-0.5 w-8"}`}
				aria-hidden="true"
			/>
		</Separator>
	);
}
