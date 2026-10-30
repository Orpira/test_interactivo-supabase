import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/** Botón flotante para volver arriba; aparece tras desplazarse más de una pantalla. */
export default function BackToTop() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.8);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	const toTop = () => {
		const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
		window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
		document.getElementById("contenido")?.focus({ preventScroll: true });
	};

	return (
		<button
			type="button"
			onClick={toTop}
			aria-label="Volver arriba"
			title="Volver arriba"
			tabIndex={visible ? 0 : -1}
			aria-hidden={!visible}
			className={`fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-30 grid h-12 w-12 place-items-center rounded-full border border-line bg-surface text-accent shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none lg:bottom-6 lg:right-6 ${
				visible ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0"
			}`}
		>
			<ArrowUp className="h-5 w-5" aria-hidden="true" />
		</button>
	);
}
