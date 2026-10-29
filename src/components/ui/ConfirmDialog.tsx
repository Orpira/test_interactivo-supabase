import { useEffect, useRef } from "react";

type Action = { label: string; onClick: () => void; variant?: "primary" | "secondary" | "ghost" };

/** Diálogo modal accesible (foco atrapado en el primer botón, Escape cierra). */
export default function ConfirmDialog({
	open,
	title,
	description,
	actions,
	onClose,
}: {
	open: boolean;
	title: string;
	description?: string;
	actions: Action[];
	onClose: () => void;
}) {
	const firstButton = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!open) return;
		firstButton.current?.focus();
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.stopPropagation();
				onClose();
			}
		};
		window.addEventListener("keydown", onKey, true);
		return () => window.removeEventListener("keydown", onKey, true);
	}, [open, onClose]);

	if (!open) return null;

	const styles = {
		primary: "bg-accent text-accent-fg hover:bg-accent/90",
		secondary: "border border-line bg-surface2 text-fg hover:border-accent/60",
		ghost: "text-muted hover:text-fg",
	};

	return (
		<div
			role="region"
			aria-label={title}
			className="fixed inset-0 z-[60] flex items-center justify-center bg-bg/80 px-4 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="confirm-title"
				aria-describedby={description ? "confirm-desc" : undefined}
				className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-2xl"
			>
				<h2 id="confirm-title" className="text-xl font-bold">
					{title}
				</h2>
				{description && (
					<p id="confirm-desc" className="mt-2 text-sm text-muted">
						{description}
					</p>
				)}
				<div className="mt-6 flex flex-col gap-2">
					{actions.map((a, i) => (
						<button
							key={a.label}
							ref={i === 0 ? firstButton : undefined}
							type="button"
							onClick={a.onClick}
							className={`min-h-touch rounded-md px-4 py-2 font-semibold transition ${styles[a.variant ?? "secondary"]}`}
						>
							{a.label}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
