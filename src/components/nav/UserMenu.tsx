import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
	BarChart3,
	ChevronDown,
	History,
	LogOut,
	Moon,
	Sun,
} from "lucide-react";
import { applyTheme, getStoredTheme, type Theme } from "@/services/theme";
import { useDismiss } from "./useDismiss";

export function Avatar({
	initial,
	size = "md",
}: {
	initial: string;
	size?: "md" | "lg";
}) {
	return (
		<span
			className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-warn font-display font-bold text-accent-fg ring-2 ring-surface ${
				size === "lg" ? "h-11 w-11 text-base" : "h-8 w-8 text-sm"
			}`}
		>
			{initial}
		</span>
	);
}

/** Menú de cuenta: Dashboard, Historial, tema y cerrar sesión. */
export default function UserMenu({
	name,
	email,
	onLogout,
}: {
	name: string;
	email?: string;
	onLogout: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [theme, setTheme] = useState<Theme>(getStoredTheme);
	const ref = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const reduceMotion = useReducedMotion();
	useDismiss(open, ref, () => setOpen(false), buttonRef);

	const itemClass =
		"flex min-h-touch w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-fg hover:bg-surface2 focus-visible:bg-surface2";

	const focusItem = (dir: 1 | -1) => {
		const items = [
			...(ref.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? []),
		];
		const i = items.indexOf(document.activeElement as HTMLElement);
		items[(i + dir + items.length) % items.length]?.focus();
	};

	return (
		<div ref={ref} className="relative">
			<button
				ref={buttonRef}
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-haspopup="menu"
				aria-expanded={open}
				aria-label={`Menú de ${name}`}
				className="flex min-h-touch items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2.5 transition hover:border-accent/60"
			>
				<Avatar initial={name.charAt(0).toUpperCase()} />
				<span className="hidden max-w-[9rem] truncate text-sm font-semibold xl:inline">
					{name}
				</span>
				<ChevronDown
					className={`h-4 w-4 text-muted transition ${
						open ? "rotate-180" : ""
					}`}
					aria-hidden="true"
				/>
			</button>
			<AnimatePresence>
				{open && (
					<motion.div
						role="menu"
						aria-label="Cuenta"
						initial={reduceMotion ? false : { opacity: 0, y: -6, scale: 0.97 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -6, scale: 0.97 }}
						transition={{ duration: 0.14 }}
						onKeyDown={(e) => {
							if (e.key === "ArrowDown") {
								e.preventDefault();
								focusItem(1);
							}
							if (e.key === "ArrowUp") {
								e.preventDefault();
								focusItem(-1);
							}
						}}
						className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-line bg-surface p-2 shadow-[0_20px_50px_-15px_rgb(0_0_0/0.5)]"
					>
						<div className="flex items-center gap-3 px-3 py-2">
							<Avatar initial={name.charAt(0).toUpperCase()} size="lg" />
							<div className="min-w-0">
								<p className="truncate font-semibold">{name}</p>
								{email && (
									<p className="truncate text-xs text-muted">{email}</p>
								)}
							</div>
						</div>
						<div className="my-1 h-px bg-line" />
						<Link
							role="menuitem"
							to="/dashboard"
							className={itemClass}
							onClick={() => setOpen(false)}
						>
							<BarChart3 className="h-4 w-4 text-muted" aria-hidden="true" />{" "}
							Dashboard
						</Link>
						<Link
							role="menuitem"
							to="/historial"
							className={itemClass}
							onClick={() => setOpen(false)}
						>
							<History className="h-4 w-4 text-muted" aria-hidden="true" />{" "}
							Historial
						</Link>
						<button
							role="menuitem"
							type="button"
							className={itemClass}
							onClick={() => {
								const next = theme === "dark" ? "light" : "dark";
								applyTheme(next);
								setTheme(next);
							}}
						>
							{theme === "dark" ? (
								<Sun className="h-4 w-4 text-muted" aria-hidden="true" />
							) : (
								<Moon className="h-4 w-4 text-muted" aria-hidden="true" />
							)}
							{theme === "dark" ? "Tema claro" : "Tema oscuro"}
						</button>
						<div className="my-1 h-px bg-line" />
						<button
							role="menuitem"
							type="button"
							className={`${itemClass} text-warn`}
							onClick={onLogout}
						>
							<LogOut className="h-4 w-4" aria-hidden="true" /> Cerrar sesión
						</button>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
