import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
	ArrowRight,
	Bot,
	Bug,
	Check,
	ChevronDown,
	Code2,
	Compass,
	Database,
	GitBranch,
	Lock,
	Map,
	MessageSquareText,
	Repeat,
	Smartphone,
	Sun,
	Target,
	Unlock,
} from "lucide-react";
import { QUIZ_CATEGORIES } from "@/components/nav/navData";
import { supabase } from "@/services/supabase";
import { openLogin } from "@/services/loginEvents";
import DemoQuestion from "./DemoQuestion";
import { LANDING_STATS as S } from "./landingStats";

/**
 * Portada para visitantes: enseña lo que hace la app (y deja probarla) antes
 * de pedir la cuenta. Los quizzes se juegan sin registro; el resto se
 * desbloquea con una cuenta gratuita.
 */
export default function Hero() {
	const navigate = useNavigate();
	const questions = useQuestionCount();
	const startQuiz = (key: string) => navigate(`/?quizCategory=${encodeURIComponent(key)}`);

	return (
		<div className="overflow-x-clip">
			{/* ---------- 1. Hero con pregunta jugable */}
			<section className="relative px-4 pb-14 pt-10 sm:px-6 sm:pt-14" aria-labelledby="portada-titulo">
				<div
					className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(60%_60%_at_70%_20%,rgb(var(--accent)/0.16),transparent_70%),radial-gradient(40%_50%_at_10%_10%,rgb(var(--warn)/0.10),transparent_70%)]"
					aria-hidden="true"
				/>
				<div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
					<div>
						<p className="inline-flex flex-wrap items-center gap-x-2 rounded-full border border-line bg-surface/70 px-3 py-1 font-mono text-xs text-muted">
							<span className="font-semibold text-accent">Gratis</span>· en español · web y Android
						</p>
						<h1 id="portada-titulo" className="mt-4 font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
							No memorices respuestas.{" "}
							<span className="bg-gradient-to-r from-accent to-warn bg-clip-text text-transparent">Entrena el trabajo de un dev.</span>
						</h1>
						<p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
							Quizzes que miden tu confianza, retos con tests en vivo, bugs reales que depurar a partir de un ticket y un repaso que
							vuelve justo a lo que estás a punto de olvidar.
						</p>
						<div className="mt-7 flex flex-col gap-3 sm:flex-row">
							<button
								type="button"
								onClick={openLogin}
								className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-accent px-6 font-semibold text-accent-fg shadow-[0_10px_30px_-12px_rgb(var(--accent)/0.9)] transition hover:-translate-y-px hover:bg-accent/90"
							>
								Crear cuenta gratis <ArrowRight className="h-4 w-4" aria-hidden="true" />
							</button>
							<a
								href="#quizzes"
								className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-6 font-semibold transition hover:border-accent/60"
							>
								Hacer un quiz sin registrarme
							</a>
						</div>
						<p className="mt-3 text-sm text-muted">Sin tarjeta y sin instalar nada. Entra con Google, GitHub o tu email.</p>
					</div>
					<DemoQuestion onSignup={openLogin} />
				</div>
			</section>

			{/* ---------- 2. Cifras */}
			<section aria-label="WebWiz en cifras" className="border-y border-line bg-surface/60 px-4 py-6 sm:px-6">
				<dl className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
					{[
						{ n: questions ? `${Math.floor(questions / 50) * 50}+` : "Cientos de", l: "preguntas de quiz" },
						{ n: S.challenges, l: "retos con tests automáticos" },
						{ n: S.incidents, l: "incidencias reales que depurar" },
						{ n: S.reviews, l: "PR de IA para revisar" },
						{ n: S.sql + S.git, l: "laboratorios de SQL y Git" },
						{ n: S.explain, l: "explicaciones corregidas por IA" },
					].map(({ n, l }) => (
						<div key={l}>
							<dt className="sr-only">{l}</dt>
							<dd className="font-display text-2xl font-bold sm:text-3xl">{n}</dd>
							<dd className="text-sm text-muted">{l}</dd>
						</div>
					))}
				</dl>
			</section>

			{/* ---------- 3. Lo que puedes hacer */}
			<section className="px-4 py-16 sm:px-6" aria-labelledby="funciones">
				<div className="mx-auto max-w-6xl">
					<p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">Qué vas a hacer</p>
					<h2 id="funciones" className="mt-2 max-w-3xl font-display text-3xl font-bold leading-tight sm:text-4xl">
						Más que preguntas: lo que te piden en tu primer trabajo
					</h2>
					<div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						<Feature
							icon={Target}
							title="Quizzes con medidor de confianza"
							text="Antes de responder dices si estás seguro. Así detectamos lo que crees saber y no sabes."
							free
						>
							<div className="flex gap-1.5 text-xs">
								<span className="rounded-md bg-surface2 px-2 py-1">Adivino</span>
								<span className="rounded-md bg-surface2 px-2 py-1">Creo que sí</span>
								<span className="rounded-md bg-accent px-2 py-1 font-semibold text-accent-fg">Seguro</span>
							</div>
							<p className="mt-2 text-sm font-semibold text-warn">Fallo con confianza alta → vuelve a tu repaso mañana</p>
						</Feature>
						<Feature icon={Bug} title="Modo Incidencia" text="Te llega un ticket de soporte con una mini-app rota. Reproduce el fallo, investiga con DevTools y arréglalo sin romper nada.">
							<p className="font-mono text-xs font-semibold text-warn">TICKET #482 · PRIORIDAD ALTA</p>
							<p className="mt-1 text-sm font-medium">El botón Pagar no responde en el móvil</p>
							<div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[0.7rem]">
								<span className="rounded border border-line px-1.5 py-0.5">Aceptación 0/3</span>
								<span className="rounded border border-line px-1.5 py-0.5">Regresión 3/3</span>
								<span className="rounded border border-line px-1.5 py-0.5">⏱ 04:12</span>
							</div>
						</Feature>
						<Feature icon={Code2} title="Retos con IDE y tests en vivo" text="Editor con autocompletado, consola y vista previa. Los tests se corrigen mientras escribes: da igual cómo lo hagas si funciona.">
							<pre className="font-mono text-xs leading-5 text-muted">
								<span className="text-accent">.zona</span> {"{"} display: grid;{"\n"}  place-items: center; {"}"}
							</pre>
							<ul className="mt-2 space-y-0.5 text-xs">
								<li className="flex items-center gap-1 text-accent"><Check className="h-3.5 w-3.5" aria-hidden="true" /> La tarjeta está centrada</li>
								<li className="flex items-center gap-1 text-accent"><Check className="h-3.5 w-3.5" aria-hidden="true" /> Funciona a 390 px</li>
							</ul>
						</Feature>
						<Feature icon={Bot} title="Revisa el código de la IA" text="Pull requests generadas por IA que «funcionan» pero esconden fallos de seguridad, bugs y accesibilidad. ¿Los encuentras?">
							<pre className="font-mono text-xs leading-5">
								<span className="text-muted">14 </span>
								<span className="text-accent">+</span> lista.innerHTML = comentarios…
							</pre>
							<p className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-warn/50 bg-warn-soft px-2 py-1 text-xs">
								<span className="font-mono font-semibold uppercase text-warn">Seguridad</span> XSS con datos del usuario
							</p>
						</Feature>
						<Feature icon={Database} title="Laboratorios de SQL y Git" text="PostgreSQL real en tu navegador y un terminal de Git con situaciones reales: «hice commit en main por error».">
							<pre className="rounded-md bg-[#0d1117] p-2 font-mono text-xs leading-5 text-[#e6edf3]">
								<span className="text-[#7aa2ff]">$ git reset --hard HEAD~1</span>
								{"\n"}HEAD está ahora en b808c4b
							</pre>
						</Feature>
						<Feature icon={MessageSquareText} title="Explícalo tú" text="Explica un concepto con tus palabras y Claude lo corrige con una rúbrica: qué cubriste, qué faltó y qué confusión tienes.">
							<p className="text-sm font-semibold">2/3 puntos clave</p>
							<div className="mt-1.5 flex gap-1" aria-hidden="true">
								<span className="h-2 w-8 rounded-full bg-accent" />
								<span className="h-2 w-8 rounded-full bg-accent" />
								<span className="h-2 w-8 rounded-full bg-surface2" />
							</div>
						</Feature>
					</div>
				</div>
			</section>

			{/* ---------- 4. Cómo funciona */}
			<section className="border-y border-line bg-surface/60 px-4 py-16 sm:px-6" aria-labelledby="como">
				<div className="mx-auto max-w-6xl">
					<p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">Cómo funciona</p>
					<h2 id="como" className="mt-2 font-display text-3xl font-bold sm:text-4xl">
						15 minutos al día, sin decidir qué estudiar
					</h2>
					<ol className="mt-10 grid gap-6 md:grid-cols-3">
						{[
							{ icon: Compass, t: "Diagnóstico de 3 minutos", d: "8 preguntas de todas las áreas fijan tu nivel y tu primer plan." },
							{ icon: Sun, t: "Tu plan de hoy", d: "Repaso de lo que estás olvidando, la incidencia del día y tu racha (con un protector semanal)." },
							{ icon: Map, t: "Tu mapa de habilidades", d: "Cada concepto en verde, azul o naranja: ves qué dominas y qué te sigue engañando." },
						].map(({ icon: Icon, t, d }, i) => (
							<li key={t} className="relative rounded-2xl border border-line bg-surface p-5">
								<span className="font-mono text-sm text-muted">0{i + 1}</span>
								<Icon className="mt-3 h-7 w-7 text-accent" aria-hidden="true" />
								<h3 className="mt-3 font-display text-lg font-bold">{t}</h3>
								<p className="mt-1 text-muted">{d}</p>
							</li>
						))}
					</ol>
					<ul className="mt-8 flex flex-wrap gap-2" aria-label="Ejemplo de mapa de habilidades">
						{[
							["Closures", "dom"],
							["Flexbox", "dom"],
							["Promesas", "prog"],
							["Event loop", "ref"],
							["Hooks de React", "prog"],
							["SQL JOIN", "ref"],
							["Ramas de Git", "new"],
						].map(([n, s]) => (
							<li
								key={n}
								className={`rounded-full border px-3 py-1 font-mono text-xs font-semibold ${
									s === "dom"
										? "border-accent bg-accent text-accent-fg"
										: s === "prog"
											? "border-accent bg-accent-soft"
											: s === "ref"
												? "border-warn bg-warn text-warn-fg"
												: "border-dashed border-muted/60 text-muted"
								}`}
							>
								{n}
							</li>
						))}
					</ul>
				</div>
			</section>

			{/* ---------- 5. Sin cuenta / con cuenta */}
			<section className="px-4 py-16 sm:px-6" aria-labelledby="cuenta" id="quizzes">
				<div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
					<div className="rounded-2xl border border-line bg-surface p-6">
						<p className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-muted">
							<Unlock className="h-4 w-4" aria-hidden="true" /> Sin cuenta
						</p>
						<h2 id="cuenta" className="mt-2 font-display text-2xl font-bold">
							Empieza ya con un quiz
						</h2>
						<p className="mt-1 text-muted">Elige un área: luego tu nivel y el tema.</p>
						<ul className="mt-5 grid gap-3 sm:grid-cols-2">
							{QUIZ_CATEGORIES.map(({ key, label, desc, icon: Icon }) => (
								<li key={key}>
									<button
										type="button"
										onClick={() => startQuiz(key)}
										className="flex h-full w-full items-start gap-3 rounded-xl border border-line p-3 text-left transition hover:border-accent/60 hover:bg-accent-softer"
									>
										<Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
										<span>
											<span className="block font-semibold">{label}</span>
											<span className="block text-sm text-muted">{desc}</span>
										</span>
									</button>
								</li>
							))}
						</ul>
					</div>
					<div className="rounded-2xl border border-accent/50 bg-accent-softer p-6">
						<p className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-accent">
							<Lock className="h-4 w-4" aria-hidden="true" /> Con tu cuenta gratis desbloqueas
						</p>
						<ul className="mt-4 space-y-2.5">
							{[
								{ icon: Code2, t: `${S.challenges} retos de código con tests (HTML, CSS, JS, accesibilidad, seguridad y rendimiento)` },
								{ icon: Bug, t: `${S.incidents} incidencias con DevTools simuladas` },
								{ icon: Bot, t: `${S.reviews} revisiones de código generado por IA` },
								{ icon: Database, t: `Laboratorio SQL y ${S.git} escenarios de Git` },
								{ icon: MessageSquareText, t: "Explicaciones corregidas por Claude" },
								{ icon: Repeat, t: "Repaso espaciado, mapa de habilidades, racha y liga semanal" },
								{ icon: GitBranch, t: "Tu progreso guardado en todos tus dispositivos" },
							].map(({ icon: Icon, t }) => (
								<li key={t} className="flex gap-2.5">
									<Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
									<span>{t}</span>
								</li>
							))}
						</ul>
						<button
							type="button"
							onClick={openLogin}
							className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent font-semibold text-accent-fg hover:bg-accent/90"
						>
							Crear cuenta gratis <ArrowRight className="h-4 w-4" aria-hidden="true" />
						</button>
						<p className="mt-2 text-center text-sm text-muted">Lo que hagas antes como invitado se guarda al crear la cuenta.</p>
					</div>
				</div>
			</section>

			{/* ---------- 6. Preguntas frecuentes */}
			<section className="border-t border-line px-4 py-16 sm:px-6" aria-labelledby="faq">
				<div className="mx-auto max-w-3xl">
					<h2 id="faq" className="font-display text-3xl font-bold">
						Preguntas frecuentes
					</h2>
					<div className="mt-6 divide-y divide-line border-y border-line">
						{FAQ.map(({ q, a }) => (
							<details key={q} className="group py-1">
								<summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
									{q}
									<ChevronDown className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
								</summary>
								<p className="pb-4 leading-relaxed text-muted">{a}</p>
							</details>
						))}
					</div>
				</div>
			</section>

			{/* ---------- 7. Cierre */}
			<section className="px-4 pb-20 sm:px-6" aria-labelledby="cierre">
				<div className="mx-auto max-w-6xl rounded-3xl bg-[#0d1117] px-6 py-12 text-center text-[#e6edf3] sm:px-12">
					<p className="font-mono text-xs font-semibold uppercase tracking-widest text-[#ffa657]">Ticket #415 abierto</p>
					<h2 id="cierre" className="mx-auto mt-3 max-w-2xl font-display text-3xl font-bold sm:text-4xl">
						Tu primera incidencia te está esperando
					</h2>
					<p className="mx-auto mt-3 max-w-xl text-[#8b949e]">Crea tu cuenta en 20 segundos y empieza con el diagnóstico de 3 minutos.</p>
					<div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
						<button
							type="button"
							onClick={openLogin}
							className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#7aa2ff] px-6 font-semibold text-[#0d1117] hover:bg-[#9bb9ff]"
						>
							Crear cuenta gratis <ArrowRight className="h-4 w-4" aria-hidden="true" />
						</button>
						<a href="#quizzes" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/20 px-6 font-semibold hover:border-white/50">
							Prefiero probar un quiz
						</a>
					</div>
					<p className="mt-6 inline-flex items-center gap-1.5 text-sm text-[#8b949e]">
						<Smartphone className="h-4 w-4" aria-hidden="true" /> También en Android ·{" "}
						<Link to="/contacto" className="underline underline-offset-2 hover:text-[#e6edf3]">
							Contacto
						</Link>
					</p>
				</div>
			</section>
		</div>
	);
}

const FAQ = [
	{ q: "¿Es gratis?", a: "Sí. Los quizzes se juegan sin cuenta y todo lo demás se desbloquea con una cuenta gratuita, sin tarjeta." },
	{
		q: "¿Qué nivel necesito?",
		a: "Desde junior hasta senior. El diagnóstico inicial fija tu nivel y el repaso se adapta a lo que aciertas, fallas o adivinas.",
	},
	{ q: "¿Tengo que instalar algo?", a: "No. Todo funciona en el navegador, incluido PostgreSQL y el terminal de Git. Si lo prefieres, hay app para Android." },
	{
		q: "¿Qué pasa con lo que hago sin cuenta?",
		a: "Tu progreso se guarda en este dispositivo y, al crear la cuenta, se sube a ella para que no pierdas nada.",
	},
	{
		q: "¿Para qué uso la IA?",
		a: "Para revisar PR generadas por IA (como en un equipo real) y para corregir tus explicaciones con una rúbrica. Tu código y tus respuestas no se publican.",
	},
];

function Feature({
	icon: Icon,
	title,
	text,
	free = false,
	children,
}: {
	icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
	title: string;
	text: string;
	free?: boolean;
	children: ReactNode;
}) {
	return (
		<article className="flex flex-col rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-accent/50">
			<div className="flex items-start justify-between gap-2">
				<Icon className="h-6 w-6 text-accent" aria-hidden="true" />
				<span
					className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[0.7rem] font-semibold ${
						free ? "bg-accent-soft text-accent" : "border border-line text-muted"
					}`}
				>
					{free ? (
						"Sin registro"
					) : (
						<>
							<Lock className="h-3 w-3" aria-hidden="true" /> Cuenta gratis
						</>
					)}
				</span>
			</div>
			<h3 className="mt-3 font-display text-lg font-bold">{title}</h3>
			<p className="mt-1 text-muted">{text}</p>
			<div className="mt-4 rounded-xl border border-line bg-bg/50 p-3" aria-hidden="true">
				{children}
			</div>
		</article>
	);
}

/** Número real de preguntas (lectura pública); si falla, se muestra "Cientos de". */
function useQuestionCount() {
	const [n, setN] = useState<number | null>(null);
	useEffect(() => {
		let cancelled = false;
		void supabase
			.from("questions")
			.select("id", { count: "exact", head: true })
			.then(({ count }) => {
				if (!cancelled && count && count > 50) setN(count);
			});
		return () => {
			cancelled = true;
		};
	}, []);
	return n;
}
