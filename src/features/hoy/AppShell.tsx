import { useEffect, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { useLeague } from "@/features/learning/useLeague";
import { BOTTOM_ITEMS, SHORTCUTS, SIDEBAR_ITEMS } from "./navItems";

/**
 * Estructura de las pantallas principales con sesión: barra lateral con
 * atajos (G H, G P…) en escritorio y barra inferior de 5 pestañas en móvil.
 */
export default function AppShell({ children }: { children: ReactNode }) {
	const { pathname } = useLocation();
	const navigate = useNavigate();

	// Atajos de dos teclas: G y luego la letra
	useEffect(() => {
		let armed = 0;
		const onKey = (e: KeyboardEvent) => {
			if (e.ctrlKey || e.metaKey || e.altKey) return;
			const t = e.target as HTMLElement | null;
			if (t?.closest("input, textarea, select, [contenteditable=true], [role=dialog]")) return;
			const k = e.key.toLowerCase();
			if (k === "g") {
				armed = Date.now();
				return;
			}
			if (armed && Date.now() - armed < 1200 && SHORTCUTS[k]) {
				e.preventDefault();
				navigate(SHORTCUTS[k]);
			}
			armed = 0;
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [navigate]);

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-wrap gap-6 px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
			<aside className="hidden shrink-0 grow basis-[220px] lg:block lg:max-w-[240px]">
				<nav aria-label="Secciones" className="sticky top-24 space-y-6">
					<ul className="space-y-1">
						{SIDEBAR_ITEMS.map(({ to, label, icon: Icon, keys, match }) => {
							const active = match.test(pathname);
							return (
								<li key={to}>
									<Link
										to={to}
										aria-current={active ? "page" : undefined}
										aria-keyshortcuts={keys.replace(" ", "+")}
										className={`flex min-h-touch items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
											active ? "bg-accent-soft text-fg" : "text-muted hover:bg-surface2 hover:text-fg"
										}`}
									>
										<Icon className={`h-5 w-5 ${active ? "text-accent" : ""}`} aria-hidden="true" />
										<span className="flex-1">{label}</span>
										<kbd className="font-mono text-[0.65rem] text-muted">{keys}</kbd>
									</Link>
								</li>
							);
						})}
					</ul>
					<LeagueCard />
				</nav>
			</aside>
			<div className="min-w-0 grow-[999] basis-[560px]">{children}</div>

			<nav
				aria-label="Secciones (barra inferior)"
				className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
			>
				{BOTTOM_ITEMS.map(({ to, short, icon: Icon, match }) => {
					const active = match.test(pathname);
					return (
						<Link
							key={to}
							to={to}
							aria-current={active ? "page" : undefined}
							className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${active ? "text-accent" : "text-muted"}`}
						>
							<Icon className="h-[22px] w-[22px]" aria-hidden="true" />
							{short}
						</Link>
					);
				})}
			</nav>
		</div>
	);
}

function LeagueCard() {
	const { summary, loading, unavailable } = useLeague();
	if (loading || unavailable || !summary) return null;
	return (
		<Link to="/ranking#liga" className="block rounded-xl border border-line bg-surface p-3 hover:border-accent/60">
			<p className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-muted">
				<Shield className="h-3.5 w-3.5" aria-hidden="true" /> Liga semanal
			</p>
			<p className="mt-1 font-semibold">
				Puesto {summary.position} · {summary.division}
			</p>
			<p className="text-xs text-muted">
				{summary.zone === "sube" ? "Zona de ascenso · " : summary.zone === "baja" ? "Zona de descenso · " : ""}
				Quedan {summary.daysLeft} {summary.daysLeft === 1 ? "día" : "días"}
			</p>
		</Link>
	);
}
