import { useState } from "react";
import { ArrowUpRight, Bug, Github, Linkedin, Mail, MapPin, MessageCircle } from "lucide-react";

/**
 * Contacto sin formulario: se elige el motivo y cada canal se abre con el
 * mensaje ya preparado (mismo enfoque que el contacto de orpira.es).
 */
const CONTACT = {
	whatsapp: "34643684541",
	email: "orpira@gmail.com",
	linkedin: "https://www.linkedin.com/in/orlando-pineda-raad-273402257",
	github: "https://github.com/Orpira",
	issues: "https://github.com/Orpira/test_interactivo-supabase/issues/new",
	portfolio: "https://orpira.es",
};

const NEEDS = [
	{ id: "error", label: "Reportar un error", text: "he encontrado un error en WebWiz Quiz:" },
	{ id: "contenido", label: "Proponer preguntas o retos", text: "tengo una propuesta de preguntas o retos para WebWiz Quiz:" },
	{ id: "editor", label: "Colaborar como editor", text: "me gustaría colaborar como editor de contenido en WebWiz Quiz." },
	{ id: "formacion", label: "Formación para mi equipo", text: "me interesa WebWiz Quiz para formar a mi equipo." },
	{ id: "otro", label: "Otro", text: "te escribo desde WebWiz Quiz:" },
] as const;

type NeedId = (typeof NEEDS)[number]["id"];

export default function Contacto() {
	const [needId, setNeedId] = useState<NeedId>("error");
	const need = NEEDS.find((n) => n.id === needId) ?? NEEDS[0];
	const greeting = `Hola Orlando, ${need.text} `;
	const subject = `WebWiz Quiz · ${need.label}`;

	const channels = [
		{
			label: "WhatsApp",
			detail: "La vía más rápida",
			href: `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(greeting)}`,
			icon: MessageCircle,
			external: true,
		},
		{
			label: "Email",
			detail: CONTACT.email,
			href: `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(greeting)}`,
			icon: Mail,
			external: false,
		},
		{
			label: "LinkedIn",
			detail: "Orlando Pineda Raad",
			href: CONTACT.linkedin,
			icon: Linkedin,
			external: true,
		},
	];

	return (
		<section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14" aria-labelledby="contacto-titulo">
			<p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">Contacto</p>
			<div className="mt-2 grid gap-10 md:grid-cols-12">
				<div className="md:col-span-5">
					<h1 id="contacto-titulo" className="font-display text-3xl font-bold leading-tight sm:text-4xl">
						¿Hablamos?
					</h1>
					<p className="mt-4 text-lg leading-relaxed text-muted">
						Elige el motivo y escríbeme por el canal que prefieras: el mensaje se abre ya preparado. Respondo personalmente.
					</p>
					<p className="mt-6 flex items-center gap-1.5 text-sm text-muted">
						<MapPin className="h-4 w-4" aria-hidden="true" /> Bilbao, España
					</p>
					<a
						href={CONTACT.portfolio}
						target="_blank"
						rel="noopener noreferrer"
						className="mt-2 inline-flex min-h-touch items-center gap-1 text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
					>
						¿Un proyecto a medida? Visita orpira.es <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
						<span className="sr-only">(se abre en otra pestaña)</span>
					</a>
				</div>

				<div className="md:col-span-7">
					<fieldset>
						<legend className="font-semibold">¿Qué necesitas?</legend>
						<div className="mt-3 flex flex-wrap gap-2">
							{NEEDS.map((n) => (
								<label key={n.id} className="cursor-pointer">
									<input
										type="radio"
										name="motivo"
										value={n.id}
										checked={needId === n.id}
										onChange={() => setNeedId(n.id)}
										className="peer sr-only"
									/>
									<span className="inline-flex min-h-10 items-center rounded-full border border-line px-4 text-sm text-muted transition-colors hover:border-fg/50 hover:text-fg peer-checked:border-fg peer-checked:bg-fg peer-checked:text-bg peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
										{n.label}
									</span>
								</label>
							))}
						</div>
					</fieldset>

					<ul className="mt-8 divide-y divide-line border-y border-line" aria-label="Canales de contacto">
						{channels.map(({ label, detail, href, icon: Icon, external }) => (
							<li key={label}>
								<a
									href={href}
									{...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
									className="group flex min-h-16 items-center gap-4 py-4 transition-colors hover:text-accent"
								>
									<span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface transition-colors group-hover:border-accent/60">
										<Icon className="h-5 w-5" aria-hidden="true" />
									</span>
									<span className="min-w-0 flex-1">
										<span className="block font-display text-lg font-semibold">{label}</span>
										<span className="block truncate text-sm text-muted">{detail}</span>
									</span>
									<ArrowUpRight className="h-5 w-5 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden="true" />
									{external && <span className="sr-only">(se abre en otra pestaña)</span>}
								</a>
							</li>
						))}
					</ul>

					{needId === "error" && (
						<p className="mt-6 flex items-start gap-2 rounded-xl border border-line bg-surface p-4 text-sm">
							<Bug className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
							<span>
								¿Sabes programar? También puedes{" "}
								<a href={CONTACT.issues} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline underline-offset-2">
									abrir una incidencia en GitHub
								</a>{" "}
								con los pasos para reproducirlo.
							</span>
						</p>
					)}

					<p className="mt-6 flex items-center gap-2 text-sm text-muted">
						<Github className="h-4 w-4" aria-hidden="true" /> El código de WebWiz Quiz está en{" "}
						<a href={CONTACT.github} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-fg">
							github.com/Orpira
						</a>
					</p>
				</div>
			</div>
		</section>
	);
}
