import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Group, Panel, Separator } from "react-resizable-panels";
import {
	ArrowLeft,
	Bug,
	Code2,
	Eye,
	Lightbulb,
	Loader2,
	Lock,
	RefreshCw,
	RotateCcw,
	Send,
	ShieldCheck,
	Timer,
	Wrench,
} from "lucide-react";
import { INCIDENTS, getIncident } from "@/content/incidents";
import { useIncidentCatalog } from "./useIncidentCatalog";
import { useAuth } from "@/services/auth";
import { saveAttempt } from "@/services/challengeAttempts";
import CodeMirrorEditor from "@/features/editor/CodeMirrorEditor";
import { languageOfFile } from "@/features/editor/languages";
import { InlineCode } from "@/components/quiz/RichText";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { FILE_NAMES, type FileName, type NetworkRecord, type TestResult } from "@/features/challenges/engine/types";
import { useDraft } from "@/features/challenges/workspace/useDraft";
import { useLiveTests } from "@/features/challenges/workspace/useLiveTests";
import { useMediaQuery } from "@/features/challenges/workspace/useMediaQuery";
import ConsolePanel, { type ConsoleEntry } from "@/features/challenges/workspace/ConsolePanel";
import PreviewFrame from "@/features/challenges/workspace/PreviewFrame";
import { changedLines } from "./diff";
import ElementsPanel from "./ElementsPanel";
import { INSPECT_PROPS, nodeLabel, type DomNode, type NodeInfo } from "./inspector";
import NetworkPanel from "./NetworkPanel";
import CloseTicketModal, { type CloseSummary } from "./CloseTicketModal";
import TicketPanel from "./TicketPanel";
import ViewportPreview, { type ViewportWidth } from "./ViewportPreview";
import { computeScore } from "./scoring";
import { recordClosed, useIncidentSession } from "./session";
import { formatClock, pushEvent } from "./timeline";
import type { IncidentSpec } from "./types";

export default function IncidentPage() {
	const { id } = useParams();
	const { incidents, loaded } = useIncidentCatalog();
	const incident = id ? (getIncident(id) ?? incidents.find((i) => i.id === id)) : undefined;
	if (!incident && !loaded) return <p className="p-6 text-center text-muted">Cargando incidencia…</p>;
	if (!incident) {
		return (
			<div className="space-y-3 p-6 text-center">
				<p>Incidencia no encontrada.</p>
				<Link to="/incidencias" className="text-accent underline">
					Ver todas las incidencias
				</Link>
			</div>
		);
	}
	return <IncidentWorkspace key={incident.id} incident={incident} />;
}

type DevTab = "elementos" | "consola" | "red" | "regresion";
type MobileTab = "ticket" | "codigo" | "vista" | "devtools";

const DEV_TABS: { id: DevTab; label: string }[] = [
	{ id: "elementos", label: "Elementos" },
	{ id: "consola", label: "Consola" },
	{ id: "red", label: "Red" },
	{ id: "regresion", label: "Regresión" },
];

const allPassed = (r: TestResult[] | null) => !!r && r.length > 0 && r.every((x) => x.passed);
const countPassed = (r: TestResult[] | null) => r?.filter((x) => x.passed).length ?? 0;

function IncidentWorkspace({ incident }: { incident: IncidentSpec }) {
	const navigate = useNavigate();
	const { user } = useAuth();
	const desktop = useMediaQuery("(min-width: 768px)");
	const draft = useDraft(incident);
	const { files, hintsShown, setHintsShown } = draft;
	const { progress, setProgress, log, restart } = useIncidentSession(incident.id);
	const closed = !!progress.closed;

	// Los tests siempre corren en el ancho del ticket, con la red simulada
	const testOptions = useMemo(
		() => ({ width: incident.viewport, height: 800, network: incident.networkLog }),
		[incident],
	);
	const acc = useLiveTests(files, incident.tests, testOptions);
	const reg = useLiveTests(files, incident.regressionTests, testOptions);

	const visibleFiles = FILE_NAMES.filter((f) => incident.editable.includes(f) || incident.files[f].trim());
	const [activeFile, setActiveFile] = useState<FileName>(incident.editable[0]);
	const [viewport, setViewport] = useState<ViewportWidth>(incident.viewport);
	const [devTab, setDevTab] = useState<DevTab>("consola");
	const [mobileTab, setMobileTab] = useState<MobileTab>("ticket");
	const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
	const [requests, setRequests] = useState<NetworkRecord[]>([]);
	const [tree, setTree] = useState<DomNode | null>(null);
	const [selected, setSelected] = useState<number[] | null>(null);
	const [nodeInfo, setNodeInfo] = useState<NodeInfo | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [status, setStatus] = useState("");
	const [summary, setSummary] = useState<CloseSummary | null>(null);
	const [confirmReset, setConfirmReset] = useState(false);
	const [now, setNow] = useState(Date.now());
	const frameRef = useRef<HTMLIFrameElement>(null);

	const index = INCIDENTS.findIndex((i) => i.id === incident.id);
	const next = index >= 0 ? INCIDENTS[index + 1] : undefined;
	const elapsed = (progress.closed ? progress.closed.durationMs : now - progress.startedAt) || 0;

	useEffect(() => {
		if (closed) return;
		const t = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(t);
	}, [closed]);

	// ---------- puente con la vista previa (consola, red e inspector)
	const previewOptions = useMemo(() => ({ network: incident.networkLog, inspector: true }), [incident]);
	const post = useCallback((msg: Record<string, unknown>) => {
		frameRef.current?.contentWindow?.postMessage({ ...msg }, "*");
	}, []);
	const requestTree = useCallback(() => post({ __webwiz: "inspect-tree" }), [post]);

	const onConsole = useCallback((entry: ConsoleEntry) => setConsoleEntries((prev) => [...prev.slice(-199), entry]), []);
	const onReload = useCallback(() => {
		setConsoleEntries([]);
		setRequests([]);
		setNodeInfo(null);
	}, []);
	const onBridgeMessage = useCallback((d: { __webwiz: string } & Record<string, unknown>) => {
		if (d.__webwiz === "network") {
			const rec = d.request as NetworkRecord;
			setRequests((prev) => {
				const i = prev.findIndex((r) => r.id === rec.id);
				if (i === -1) return [...prev.slice(-99), rec];
				const copy = prev.slice();
				copy[i] = rec;
				return copy;
			});
		} else if (d.__webwiz === "inspect-tree-result") {
			setTree(d.tree as DomNode);
		} else if (d.__webwiz === "inspect-node-result") {
			setNodeInfo({ path: d.path as number[], styles: d.styles as Record<string, string>, rect: d.rect as NodeInfo["rect"] });
		}
	}, []);

	// Al cargar el documento: árbol nuevo y se vuelve a inspeccionar el nodo elegido
	useEffect(() => {
		const frame = frameRef.current;
		if (!frame) return;
		const onLoad = () => {
			requestTree();
			if (selected) post({ __webwiz: "inspect-node", path: selected, props: INSPECT_PROPS });
		};
		frame.addEventListener("load", onLoad);
		return () => frame.removeEventListener("load", onLoad);
	}, [requestTree, post, selected, desktop, mobileTab]);

	const selectNode = (n: DomNode) => {
		setSelected(n.path);
		post({ __webwiz: "inspect-node", path: n.path, props: INSPECT_PROPS });
		log("inspect", `Inspeccionó ${nodeLabel(n)}`);
	};

	const openDevTab = (tab: DevTab) => {
		setDevTab(tab);
		if (tab === "elementos") requestTree();
		log("panel", `Abrió ${DEV_TABS.find((t) => t.id === tab)?.label}`);
	};

	const changeViewport = (w: ViewportWidth) => {
		setViewport(w);
		log("viewport", `Cambió la vista a ${w}px`);
	};

	const setFile = (name: FileName, value: string) => {
		draft.setFile(name, value);
		log("edit", `Editó ${name}`);
	};

	const showHint = () => {
		const n = Math.min(hintsShown + 1, incident.hints.length);
		setHintsShown(n);
		log("hint", `Pidió la pista ${n}`);
	};

	// ---------- enviar el arreglo
	const submit = useCallback(async () => {
		if (closed || submitting) return;
		setSubmitting(true);
		setStatus("");
		const [a, r] = await Promise.all([acc.runNow(), reg.runNow()]);
		setSubmitting(false);
		const okA = a.every((x) => x.passed);
		const okR = r.every((x) => x.passed);
		const t = Date.now() - progress.startedAt;
		const submits = progress.submits + 1;

		if (okA && okR) {
			const linesChanged = changedLines(incident.files, files, incident.editable);
			const referenceLines = changedLines(incident.files, { ...incident.files, ...incident.solution }, incident.editable);
			const score = computeScore({
				durationMs: t,
				expectedMin: incident.durationMin,
				failedSubmits: progress.failedSubmits,
				hints: hintsShown,
				regressionBreaks: progress.regressionBreaks,
				linesChanged,
				referenceLines,
			});
			const timeline = pushEvent(progress.timeline, { t, kind: "solved", label: `Ticket cerrado · ${score.total} puntos` });
			const closedInfo = { score: score.total, durationMs: t, linesChanged, at: Date.now() };
			setProgress({ ...progress, submits, timeline, closed: closedInfo });
			recordClosed(incident.id, closedInfo);
			setSummary({ score, durationMs: t, submits, linesChanged, referenceLines, timeline });
			if (user) {
				void saveAttempt({
					userId: user.id,
					challengeId: incident.id,
					code: Object.fromEntries(incident.editable.map((f) => [f, files[f]])),
					results: [...a, ...r],
					hintsUsed: hintsShown,
					durationMs: t,
					timeline,
					score: score.total,
				});
			}
			return;
		}

		const brokenReg = r.filter((x) => !x.passed).length;
		let timeline = pushEvent(progress.timeline, {
			t,
			kind: "submit-fail",
			label: `Envío ${submits}: aceptación ${countPassed(a)}/${a.length}`,
		});
		if (brokenReg) timeline = pushEvent(timeline, { t, kind: "regression", label: `Rompió ${brokenReg} test(s) de regresión` });
		setProgress({
			...progress,
			submits,
			failedSubmits: progress.failedSubmits + 1,
			regressionBreaks: progress.regressionBreaks + (brokenReg ? 1 : 0),
			timeline,
		});
		setStatus(
			brokenReg
				? `El ticket sigue abierto: tu cambio rompe ${brokenReg} test(s) de regresión. Revisa la pestaña Regresión.`
				: `El ticket sigue abierto: ${countPassed(a)}/${a.length} tests de aceptación. El fallo aún se reproduce.`,
		);
		if (brokenReg) setDevTab("regresion");
		if (user) {
			void saveAttempt({
				userId: user.id,
				challengeId: incident.id,
				code: Object.fromEntries(incident.editable.map((f) => [f, files[f]])),
				results: [...a, ...r],
				hintsUsed: hintsShown,
				durationMs: t,
				timeline,
			});
		}
	}, [closed, submitting, acc, reg, progress, incident, files, hintsShown, setProgress, user]);

	// Ctrl/Cmd + Enter: enviar el arreglo
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
				e.preventDefault();
				void submit();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [submit]);

	const reopen = () => {
		draft.reset();
		restart();
		setSummary(null);
		setStatus("");
		setConfirmReset(false);
	};

	// ---------- piezas
	const accOk = allPassed(acc.results);
	const regOk = allPassed(reg.results);
	const counters = (
		<div className="flex flex-wrap items-center gap-2 font-mono text-xs" aria-live="polite">
			<span
				className={`inline-flex min-h-8 items-center gap-1.5 rounded-md border px-2 ${accOk ? "border-accent/50 bg-accent-soft text-accent" : "border-line text-muted"}`}
			>
				<ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
				Aceptación (ocultos) {acc.results ? `${countPassed(acc.results)}/${acc.results.length}` : `–/${incident.tests.length}`}
			</span>
			<span
				className={`inline-flex min-h-8 items-center gap-1.5 rounded-md border px-2 ${
					!reg.results ? "border-line text-muted" : regOk ? "border-line text-fg" : "border-warn/50 bg-warn-soft text-warn"
				}`}
			>
				Regresión {reg.results ? `${countPassed(reg.results)}/${reg.results.length}` : `–/${incident.regressionTests.length}`}
			</span>
			{(acc.running || reg.running) && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" aria-label="Ejecutando tests" />}
			<span className="inline-flex min-h-8 items-center gap-1 px-1 text-muted" aria-live="off">
				<Timer className="h-3.5 w-3.5" aria-hidden="true" />
				<span className="sr-only">Tiempo: </span>
				{formatClock(elapsed)}
			</span>
		</div>
	);

	const actions = (
		<div className="flex flex-wrap items-center gap-2">
			<button
				type="button"
				onClick={() => void submit()}
				disabled={closed || submitting}
				className="inline-flex min-h-touch items-center gap-2 rounded-md bg-accent px-4 font-semibold text-accent-fg hover:bg-accent/90 disabled:opacity-60"
			>
				{submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
				Enviar arreglo
				<kbd aria-hidden="true" className="hidden rounded border border-current px-1 font-mono text-[0.7rem] lg:inline">
					Ctrl+Enter
				</kbd>
			</button>
			<button
				type="button"
				onClick={showHint}
				disabled={closed || hintsShown >= incident.hints.length}
				className="inline-flex min-h-touch items-center gap-2 rounded-md border border-line bg-surface2 px-3 font-medium hover:border-accent/60 disabled:opacity-50"
			>
				<Lightbulb className="h-4 w-4" aria-hidden="true" /> Pista ({incident.hints.length - hintsShown})
			</button>
			<button
				type="button"
				onClick={() => setConfirmReset(true)}
				className="inline-flex min-h-touch items-center gap-1.5 rounded-md px-2 text-sm text-muted hover:text-fg"
			>
				<RotateCcw className="h-4 w-4" aria-hidden="true" /> {closed ? "Reabrir" : "Restablecer"}
			</button>
		</div>
	);

	const statusLine = (status || closed) && (
		<p role="status" className={`text-sm ${closed ? "text-accent" : "text-warn"}`}>
			{closed ? `Incidencia cerrada con ${progress.closed?.score} puntos.` : status}
		</p>
	);

	const hintStrip = hintsShown > 0 && (
		<div className="shrink-0 border-b border-accent/30 bg-accent-soft px-3 py-2 text-sm">
			<span className="font-mono text-xs font-semibold text-accent">
				PISTA {hintsShown}/{incident.hints.length}
			</span>
			<p className="mt-0.5">
				<InlineCode text={incident.hints[hintsShown - 1]} />
			</p>
		</div>
	);

	const fileTabs = (
		<div role="tablist" aria-label="Archivos" className="flex shrink-0 gap-1 overflow-x-auto border-b border-line px-1">
			{visibleFiles.map((f) => {
				const editable = incident.editable.includes(f);
				return (
					<button
						key={f}
						type="button"
						role="tab"
						aria-selected={activeFile === f}
						aria-controls="panel-codigo"
						onClick={() => setActiveFile(f)}
						className={`-mb-px inline-flex min-h-touch shrink-0 items-center gap-1.5 border-b-2 px-3 font-mono text-sm ${
							activeFile === f ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg"
						}`}
					>
						{f}
						{!editable && <Lock className="h-3.5 w-3.5" aria-label="solo lectura" />}
					</button>
				);
			})}
		</div>
	);

	const editor = (
		<div id="panel-codigo" role="tabpanel" className="min-h-0 flex-1 p-2">
			<CodeMirrorEditor
				key={activeFile}
				value={files[activeFile]}
				onChange={(value) => setFile(activeFile, value)}
				language={languageOfFile(activeFile)}
				readOnly={closed || !incident.editable.includes(activeFile)}
				label={`Editor de ${activeFile}${incident.editable.includes(activeFile) ? "" : " (solo lectura)"}`}
				className="h-full"
				minHeight="100%"
			/>
		</div>
	);

	const preview = (
		<ViewportPreview width={viewport} onWidth={changeViewport} reproduce={incident.viewport}>
			<PreviewFrame
				files={files}
				onConsole={onConsole}
				onReload={onReload}
				options={previewOptions}
				onBridgeMessage={onBridgeMessage}
				frameRef={frameRef}
				title={`Vista previa de la incidencia #${incident.number}`}
			/>
		</ViewportPreview>
	);

	const errors = consoleEntries.filter((e) => e.level === "error").length;
	const devtools = (
		<section aria-label="Herramientas de desarrollo" className="flex h-full min-h-0 flex-col bg-surface">
			<div className="flex shrink-0 items-center border-b border-line">
				<div role="tablist" aria-label="DevTools" className="flex min-w-0 flex-1 overflow-x-auto">
					{DEV_TABS.map((t) => {
						const badge =
							t.id === "consola" && errors
								? errors
								: t.id === "red" && requests.length
									? requests.length
									: t.id === "regresion" && reg.results && !regOk
										? "!"
										: null;
						return (
							<button
								key={t.id}
								type="button"
								role="tab"
								id={`dev-tab-${t.id}`}
								aria-selected={devTab === t.id}
								aria-controls="dev-panel"
								onClick={() => openDevTab(t.id)}
								className={`-mb-px inline-flex min-h-10 shrink-0 items-center gap-1.5 border-b-2 px-3 text-xs font-medium ${
									devTab === t.id ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg"
								}`}
							>
								{t.label}
								{badge !== null && (
									<span className={`rounded-full px-1.5 font-mono text-[0.65rem] ${t.id === "red" ? "bg-surface2 text-fg" : "bg-warn-soft text-warn"}`}>
										{badge}
									</span>
								)}
							</button>
						);
					})}
				</div>
				{devTab === "elementos" && (
					<button
						type="button"
						onClick={requestTree}
						className="mr-1 inline-flex min-h-8 items-center gap-1 rounded px-2 text-xs text-muted hover:bg-surface2 hover:text-fg"
					>
						<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Actualizar
					</button>
				)}
			</div>
			<div id="dev-panel" role="tabpanel" aria-labelledby={`dev-tab-${devTab}`} className="min-h-0 flex-1">
				{devTab === "elementos" && (
					<ElementsPanel tree={tree} selected={selected} info={nodeInfo} suspects={incident.suspects} onSelect={selectNode} />
				)}
				{devTab === "consola" && (
					<ConsolePanel entries={consoleEntries} onClear={() => setConsoleEntries([])} />
				)}
				{devTab === "red" && <NetworkPanel records={requests} expected={incident.networkLog} />}
				{devTab === "regresion" && (
					<ul className="h-full space-y-2 overflow-auto p-3 text-sm" aria-label="Tests de regresión">
						{incident.regressionTests.map((t) => {
							const r = reg.results?.find((x) => x.name === t.name);
							return (
								<li key={t.name} className="flex gap-2">
									<span
										className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${!r ? "bg-line" : r.passed ? "bg-accent" : "bg-warn"}`}
										aria-hidden="true"
									/>
									<span>
										<span className="sr-only">{!r ? "Pendiente: " : r.passed ? "Superado: " : "Roto: "}</span>
										{t.name}
										{r && !r.passed && <span className="block text-xs text-warn">{r.message}</span>}
									</span>
								</li>
							);
						})}
						<li className="pt-1 text-xs text-muted">
							Los {incident.tests.length} tests de aceptación están ocultos: verifican el arreglo sin revelar la solución.
						</li>
					</ul>
				)}
			</div>
		</section>
	);

	const breadcrumb = (
		<nav className="flex items-center gap-2 font-mono text-xs text-muted" aria-label="Migas de pan">
			<Link to="/incidencias" className="inline-flex min-h-8 items-center gap-1 hover:text-fg">
				<ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Incidencias
			</Link>
			<span>
				· {index >= 0 ? `${index + 1} de ${INCIDENTS.length}` : "comunidad"}
			</span>
		</nav>
	);

	const dialogs = (
		<>
			<ConfirmDialog
				open={confirmReset}
				title={closed ? "¿Reabrir la incidencia?" : "¿Restablecer el código?"}
				description={
					closed
						? "Vuelves al código con el fallo y el cronómetro empieza de cero. Tu mejor puntuación se conserva."
						: "Se perderán tus cambios y volverás al código con el fallo. El cronómetro sigue corriendo."
				}
				onClose={() => setConfirmReset(false)}
				actions={[
					{ label: "Cancelar", variant: "secondary", onClick: () => setConfirmReset(false) },
					{
						label: closed ? "Reabrir" : "Restablecer",
						variant: "primary",
						onClick: () => {
							if (closed) reopen();
							else {
								draft.reset();
								setConfirmReset(false);
							}
						},
					},
				]}
			/>
			{summary && (
				<CloseTicketModal
					incident={incident}
					summary={summary}
					onClose={() => setSummary(null)}
					onList={() => navigate("/incidencias")}
					onNext={next ? () => navigate(`/incidencias/${next.id}`) : undefined}
				/>
			)}
		</>
	);

	if (desktop) {
		return (
			<div className="flex h-[calc(100dvh-4.1rem)] min-h-[640px] flex-col">
				<header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-6">
					{breadcrumb}
					<div className="ml-auto flex flex-wrap items-center gap-3">
						{counters}
						{actions}
					</div>
					{statusLine && <div className="w-full">{statusLine}</div>}
				</header>
				<Group orientation="horizontal" className="min-h-0 flex-1 border-t border-line">
					<Panel defaultSize="42" minSize="28" className="flex min-w-0 flex-col bg-surface">
						<details open className="group shrink-0 border-b border-line">
							<summary className="flex min-h-10 cursor-pointer items-center gap-2 px-3 font-mono text-xs font-semibold uppercase tracking-widest text-muted hover:text-fg">
								<Bug className="h-3.5 w-3.5" aria-hidden="true" /> Ticket #{incident.number}
								<span className="ml-auto normal-case tracking-normal group-open:hidden">mostrar</span>
							</summary>
							<div className="max-h-[38vh] overflow-auto px-4 pb-4">
								<TicketPanel incident={incident} />
							</div>
						</details>
						{fileTabs}
						{hintStrip}
						{editor}
					</Panel>
					<ResizeHandle orientation="horizontal" />
					<Panel defaultSize="58" minSize="30" className="min-w-0">
						<Group orientation="vertical">
							<Panel defaultSize="55" minSize="20">
								{preview}
							</Panel>
							<ResizeHandle orientation="vertical" />
							<Panel defaultSize="45" minSize="15">
								{devtools}
							</Panel>
						</Group>
					</Panel>
				</Group>
				{dialogs}
			</div>
		);
	}

	// ---------- Móvil: una vista a la vez y pestañas inferiores
	const MOBILE_TABS = [
		{ id: "ticket", label: "Ticket", icon: Bug },
		{ id: "codigo", label: "Código", icon: Code2 },
		{ id: "vista", label: "Vista", icon: Eye },
		{ id: "devtools", label: "DevTools", icon: Wrench },
	] as const;

	return (
		<div className="flex h-[calc(100dvh-4.1rem)] flex-col">
			<div className="shrink-0 border-b border-line px-3 py-2">
				<h1 className="sr-only">
					Incidencia #{incident.number}: {incident.title}
				</h1>
				{counters}
			</div>
			<div className="min-h-0 flex-1 overflow-auto">
				{mobileTab === "ticket" && (
					<div className="space-y-4 p-4">
						{breadcrumb}
						<TicketPanel incident={incident} heading="h2" />
						{actions}
						{statusLine}
					</div>
				)}
				{mobileTab === "codigo" && (
					<div className="flex h-full min-h-[420px] flex-col">
						{fileTabs}
						{hintStrip}
						{editor}
						<div className="shrink-0 space-y-2 border-t border-line p-2">
							{actions}
							{statusLine}
						</div>
					</div>
				)}
				{/* Una sola vista previa montada siempre: cambiar de pestaña no la recarga,
				    así consola y red conservan lo ocurrido */}
				<div
					className={mobileTab === "vista" ? "h-full" : "pointer-events-none fixed left-0 top-0 h-[600px] w-[390px] opacity-0"}
					aria-hidden={mobileTab !== "vista" || undefined}
					inert={mobileTab !== "vista" || undefined}
				>
					{preview}
				</div>
				{mobileTab === "devtools" && <div className="h-full">{devtools}</div>}
			</div>
			<nav aria-label="Vistas de la incidencia" className="grid shrink-0 grid-cols-4 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
				{MOBILE_TABS.map(({ id, label, icon: Icon }) => (
					<button
						key={id}
						type="button"
						aria-current={mobileTab === id ? "page" : undefined}
						onClick={() => setMobileTab(id)}
						className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
							mobileTab === id ? "text-accent" : "text-muted"
						}`}
					>
						<Icon className="h-5 w-5" aria-hidden="true" />
						{label}
					</button>
				))}
			</nav>
			{dialogs}
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
