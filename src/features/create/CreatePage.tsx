import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, FilePlus2, Loader2, Lock, Send, ShieldCheck, XCircle } from "lucide-react";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/services/auth";
import CodeMirrorEditor from "@/features/editor/CodeMirrorEditor";
import PreviewFrame from "@/features/challenges/workspace/PreviewFrame";
import { runChallengeTests } from "@/features/challenges/engine/runner";
import type { ChallengeFiles, ChallengeSpec, TestResult } from "@/features/challenges/engine/types";
import type { IncidentSpec } from "@/features/incidents/types";
import { CHALLENGE_TEMPLATE, INCIDENT_TEMPLATE } from "./templates";
import { validateDraft } from "./validate";

type Kind = "challenge" | "incident";
type Check = { label: string; ok: boolean; detail?: string };

/** /crear: editor de retos e incidencias para la comunidad (rol editor). */
export default function CreatePage() {
	const { user } = useAuth();
	const [role, setRole] = useState<"cargando" | "editor" | "no">("cargando");

	useEffect(() => {
		if (!user) return;
		let cancelled = false;
		void supabase.rpc("is_content_editor").then(({ data, error }) => {
			if (!cancelled) setRole(!error && data === true ? "editor" : "no");
		});
		return () => {
			cancelled = true;
		};
	}, [user]);

	if (role === "cargando") return <p className="p-6 text-center text-muted">Comprobando permisos…</p>;
	if (role === "no")
		return (
			<section className="mx-auto max-w-lg space-y-3 px-4 py-16 text-center">
				<Lock className="mx-auto h-10 w-10 text-muted" aria-hidden="true" />
				<h1 className="font-display text-2xl font-bold">Solo para editores</h1>
				<p className="text-muted">
					Para publicar retos e incidencias necesitas el rol <strong>editor</strong>. Si quieres colaborar,{" "}
					<Link to="/contacto" className="text-accent underline">
						escríbenos
					</Link>
					.
				</p>
			</section>
		);
	return <Creator />;
}

function Creator() {
	const { user } = useAuth();
	const [kind, setKind] = useState<Kind>("challenge");
	const [text, setText] = useState(CHALLENGE_TEMPLATE);
	const [checks, setChecks] = useState<Check[] | null>(null);
	const [validated, setValidated] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [published, setPublished] = useState<string | null>(null);
	const [publishError, setPublishError] = useState<string | null>(null);
	const [show, setShow] = useState<"inicial" | "solucion">("inicial");

	const parsed = useMemo(() => validateDraft(text, kind), [text, kind]);
	const spec = parsed.ok ? parsed.spec : null;
	const previewFiles = useMemo<ChallengeFiles | null>(
		() => (spec ? (show === "inicial" ? spec.files : { ...spec.files, ...spec.solution }) : null),
		[spec, show],
	);
	const previewOptions = useMemo(
		() => (spec && "networkLog" in spec ? { network: spec.networkLog } : spec && "run" in spec && spec.run?.network ? { network: spec.run.network } : undefined),
		[spec],
	);

	const switchKind = (k: Kind) => {
		setKind(k);
		setText(k === "challenge" ? CHALLENGE_TEMPLATE : INCIDENT_TEMPLATE);
		setChecks(null);
		setValidated(null);
	};

	const validate = async () => {
		if (!parsed.ok) {
			setChecks(parsed.errors.map((e) => ({ label: e, ok: false })));
			return;
		}
		setBusy(true);
		const s = parsed.spec;
		const opts = "networkLog" in s ? { width: s.viewport, height: 800, network: s.networkLog } : ((s as ChallengeSpec).run ?? {});
		const sol = { ...s.files, ...s.solution };
		const failing = (rs: TestResult[]) => rs.filter((r) => !r.passed).map((r) => `${r.name}: ${r.message}`).join(" · ");
		const starter = await runChallengeTests(s.files, s.tests, opts);
		const solved = await runChallengeTests(sol, s.tests, opts);
		const list: Check[] = [
			{ label: "JSON y estructura correctos", ok: true },
			{ label: "El código inicial falla al menos un test", ok: starter.some((r) => !r.passed), detail: starter.every((r) => r.passed) ? "Todos los tests pasan sin hacer nada: el reto no enseña nada." : undefined },
			{ label: "La solución pasa todos los tests", ok: solved.every((r) => r.passed), detail: failing(solved) || undefined },
		];
		if ("regressionTests" in s) {
			const regStart = await runChallengeTests(s.files, (s as IncidentSpec).regressionTests, opts);
			const regSol = await runChallengeTests(sol, (s as IncidentSpec).regressionTests, opts);
			list.push(
				{ label: "Regresión: el código con el fallo la pasa", ok: regStart.every((r) => r.passed), detail: failing(regStart) || undefined },
				{ label: "Regresión: la solución también la pasa", ok: regSol.every((r) => r.passed), detail: failing(regSol) || undefined },
			);
		}
		setChecks(list);
		setValidated(list.every((c) => c.ok) ? text : null);
		setBusy(false);
	};

	const publish = async () => {
		if (!spec || validated !== text || !user) return;
		setBusy(true);
		setPublishError(null);
		const isIncident = kind === "incident";
		const { error } = await supabase.from("challenges").insert({
			id: spec.id,
			title: spec.title,
			instructions: isIncident ? (spec as IncidentSpec).ticket.actual : (spec as ChallengeSpec).instructions,
			category: isIncident ? "incidencias" : (spec as ChallengeSpec).category,
			type: isIncident ? "incident" : "challenge",
			difficulty: spec.difficulty,
			concepts: spec.concepts,
			spec,
			legacy: false,
			author_id: user.id,
		});
		setBusy(false);
		if (error) setPublishError(error.code === "23505" ? `Ya existe contenido con el id «${spec.id}».` : error.message);
		else setPublished(isIncident ? `/incidencias` : `/editor/${(spec as ChallengeSpec).category}/${spec.id}`);
	};

	return (
		<section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6">
			<p className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-accent">
				<FilePlus2 className="h-3.5 w-3.5" aria-hidden="true" /> Crear contenido
			</p>
			<h1 className="mt-1 text-3xl font-bold">Nuevo {kind === "challenge" ? "reto" : "incidencia"}</h1>
			<p className="mt-1 max-w-3xl text-muted">
				Escribe el JSON, mira la vista previa y valida: solo se puede publicar si el código inicial falla y la solución pasa todos los tests.
			</p>
			<div role="radiogroup" aria-label="Tipo de contenido" className="mt-4 inline-flex rounded-lg border border-line bg-surface p-1">
				{(["challenge", "incident"] as Kind[]).map((k) => (
					<button
						key={k}
						type="button"
						role="radio"
						aria-checked={kind === k}
						onClick={() => switchKind(k)}
						className={`min-h-touch rounded-md px-4 text-sm font-semibold ${kind === k ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"}`}
					>
						{k === "challenge" ? "Reto" : "Incidencia"}
					</button>
				))}
			</div>

			<div className="mt-4 grid gap-4 lg:grid-cols-2">
				<div className="min-w-0 space-y-3">
					<CodeMirrorEditor
						value={text}
						onChange={(v) => {
							setText(v);
							setPublished(null);
						}}
						language="javascript"
						label="JSON del contenido"
						minHeight="28rem"
						className="max-h-[70vh] overflow-auto"
					/>
					{!parsed.ok && (
						<ul className="space-y-1 rounded-lg border border-warn/50 bg-warn-soft p-3 text-sm" aria-live="polite">
							{parsed.errors.map((e) => (
								<li key={e}>• {e}</li>
							))}
						</ul>
					)}
				</div>
				<div className="min-w-0 space-y-3">
					<div className="overflow-hidden rounded-xl border border-line">
						<div className="flex items-center justify-between border-b border-line bg-surface px-3 py-1.5">
							<span className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">Vista previa</span>
							<div role="radiogroup" aria-label="Versión" className="flex gap-1">
								{(["inicial", "solucion"] as const).map((v) => (
									<button key={v} type="button" role="radio" aria-checked={show === v} onClick={() => setShow(v)} className={`min-h-8 rounded px-2 text-xs ${show === v ? "bg-accent-soft text-fg" : "text-muted hover:text-fg"}`}>
										{v === "inicial" ? "Código inicial" : "Solución"}
									</button>
								))}
							</div>
						</div>
						<div className="h-72 bg-white">
							{previewFiles ? (
								<PreviewFrame files={previewFiles} onConsole={() => {}} onReload={() => {}} options={previewOptions} title="Vista previa del contenido" />
							) : (
								<p className="p-4 text-sm text-[#57606a]">Corrige el JSON para ver la vista previa.</p>
							)}
						</div>
					</div>
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={() => void validate()}
							disabled={busy}
							className="inline-flex min-h-touch items-center gap-2 rounded-md border border-line bg-surface2 px-4 font-semibold hover:border-accent/60 disabled:opacity-60"
						>
							{busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />} Validar
						</button>
						<button
							type="button"
							onClick={() => void publish()}
							disabled={busy || validated !== text}
							title={validated !== text ? "Valida primero (y vuelve a validar tras cada cambio)" : undefined}
							className="inline-flex min-h-touch items-center gap-2 rounded-md bg-accent px-4 font-semibold text-accent-fg hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-surface2 disabled:text-muted"
						>
							<Send className="h-4 w-4" aria-hidden="true" /> Publicar
						</button>
					</div>
					<div aria-live="polite" className="space-y-2">
						{checks && (
							<ul className="space-y-1.5 rounded-xl border border-line bg-surface p-3 text-sm">
								{checks.map((c) => (
									<li key={c.label} className="flex gap-2">
										{c.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-label="Correcto" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-label="Falla" />}
										<span>
											{c.label}
											{c.detail && <span className="block text-xs text-muted">{c.detail}</span>}
										</span>
									</li>
								))}
							</ul>
						)}
						{publishError && <p role="alert" className="rounded-lg border border-warn/50 bg-warn-soft p-3 text-sm">{publishError}</p>}
						{published && (
							<p className="rounded-lg border border-accent/50 bg-accent-softer p-3 text-sm">
								¡Publicado!{" "}
								<Link to={published} className="font-semibold text-accent underline">
									Ver en la app
								</Link>
							</p>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}
