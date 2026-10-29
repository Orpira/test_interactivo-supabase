import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme, getStoredTheme, type Theme } from "@/services/theme";

/** Alterna entre tema oscuro (por defecto) y claro; se guarda en localStorage. */
export default function ThemeToggle({ className = "" }: { className?: string }) {
	const [theme, setTheme] = useState<Theme>(getStoredTheme);
	const next: Theme = theme === "dark" ? "light" : "dark";

	return (
		<button
			type="button"
			onClick={() => {
				applyTheme(next);
				setTheme(next);
			}}
			aria-label={next === "light" ? "Activar tema claro" : "Activar tema oscuro"}
			title={next === "light" ? "Tema claro" : "Tema oscuro"}
			className={`inline-flex min-h-touch min-w-touch items-center justify-center rounded-md text-muted transition hover:bg-surface2 hover:text-fg ${className}`}
		>
			{theme === "dark" ? (
				<Sun className="h-5 w-5" aria-hidden="true" />
			) : (
				<Moon className="h-5 w-5" aria-hidden="true" />
			)}
		</button>
	);
}
