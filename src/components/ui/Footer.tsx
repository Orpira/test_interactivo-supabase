import {
	FaEnvelope,
	FaGithub,
	FaLinkedin,
	FaMapMarkerAlt,
} from "react-icons/fa";
import { Link } from "react-router-dom";

export default function Footer() {
	return (
		<footer className="mt-0 py-3 px-4 border-t border-slate-200 bg-slate-50 text-center">
			<div className="max-w-3xl mx-auto">
				<div className="flex justify-center gap-5 mb-2">
					<Link
						to="/contacto"
						className="text-slate-600 hover:text-indigo-700 transition-colors"
						aria-label="Formulario de contacto"
					>
						<FaEnvelope className="w-5 h-5" />
					</Link>
					<a
						href="https://www.linkedin.com/in/orlando-pineda-raad-273402257"
						target="_blank"
						rel="noopener noreferrer"
						className="text-slate-600 hover:text-indigo-700 transition-colors"
						aria-label="LinkedIn"
					>
						<FaLinkedin className="w-5 h-5" />
					</a>
					<a
						href="https://github.com/Orpira"
						target="_blank"
						rel="noopener noreferrer"
						className="text-slate-600 hover:text-indigo-700 transition-colors"
						aria-label="GitHub"
					>
						<FaGithub className="w-5 h-5" />
					</a>
				</div>

				<p className="text-[11px] text-slate-500 font-medium leading-none">
					<i className="fa fa-copyright" aria-hidden="true"></i> OrPiRa - Test
					Interactivos
				</p>

				<p className="text-xs text-slate-600 mt-1 flex items-center justify-center gap-1 leading-none">
					<FaMapMarkerAlt className="w-3.5 h-3.5" />
					Bilbao, España
				</p>
				<p className="text-[11px] text-slate-500 mt-0.5 leading-none">
					{new Date().getFullYear()}
				</p>
			</div>
		</footer>
	);
}
