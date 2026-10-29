import { Github, Linkedin, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const LINK = "flex min-h-touch min-w-touch items-center justify-center rounded-full text-muted transition-colors hover:bg-surface2 hover:text-accent";

export default function Footer() {
	return (
		<footer className="border-t border-line bg-surface px-4 py-4">
			<div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
				<p className="flex items-center gap-2 text-sm text-muted">
					<img src="/logo-96.webp" alt="" width="20" height="20" className="h-5 w-5" />
					<span>
						© {new Date().getFullYear()} OrPiRa · WebWiz Quiz
					</span>
					<span className="hidden items-center gap-1 sm:inline-flex">
						· <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Bilbao, España
					</span>
				</p>
				<nav aria-label="Contacto y redes" className="flex items-center gap-1">
					<Link to="/contacto" className={LINK} aria-label="Formulario de contacto">
						<Mail className="h-5 w-5" aria-hidden="true" />
					</Link>
					<a
						href="https://www.linkedin.com/in/orlando-pineda-raad-273402257"
						target="_blank"
						rel="noopener noreferrer"
						className={LINK}
						aria-label="LinkedIn"
					>
						<Linkedin className="h-5 w-5" aria-hidden="true" />
					</a>
					<a
						href="https://github.com/Orpira"
						target="_blank"
						rel="noopener noreferrer"
						className={LINK}
						aria-label="GitHub"
					>
						<Github className="h-5 w-5" aria-hidden="true" />
					</a>
				</nav>
			</div>
		</footer>
	);
}
