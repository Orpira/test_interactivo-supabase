import React, { useEffect, useMemo, useState } from "react";

export type QuizCategoryModalProps = {
	open: boolean;
	onClose: () => void;
	category: string;
	subcategories: { name: string; slug: string; questionCount: number }[];
	loading?: boolean;
	error?: string;
	onStartQuiz: (subcategory: string, count: number) => void;
};

export default function QuizCategoryModal({
	open,
	onClose,
	category,
	subcategories,
	loading = false,
	error = "",
	onStartQuiz,
}: QuizCategoryModalProps) {
	const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
	const [count, setCount] = useState<number>(5);

	useEffect(() => {
		if (!open) return;
		setSelectedSubcategory("");
		setCount(5);
	}, [open, category]);

	const selectedSubcategoryData = useMemo(
		() => subcategories.find((sub) => sub.name === selectedSubcategory),
		[subcategories, selectedSubcategory]
	);

	const countOptions = useMemo(() => {
		// Máximo 50 preguntas por quiz (coincide con QuizRunner y la BD)
		const available = Math.min(selectedSubcategoryData?.questionCount ?? 0, 50);
		const base = [5, 10, 15, 20].filter((n) => n <= available);
		if (available > 0 && !base.includes(available)) {
			base.push(available);
		}
		return base.sort((a, b) => a - b);
	}, [selectedSubcategoryData]);

	useEffect(() => {
		if (countOptions.length > 0 && !countOptions.includes(count)) {
			setCount(countOptions[0]);
		}
	}, [countOptions, count]);

	const formatSubcategoryName = (rawName: string) => {
		const cleaned = rawName.trim();
		const normalized = cleaned.toLowerCase();

		const aliases: Record<string, string> = {
			html: "HTML",
			css: "CSS",
			js: "JavaScript",
			javascript: "JavaScript",
			typescript: "TypeScript",
			reactjs: "React",
			react: "React",
			node: "Node.js",
			nodejs: "Node.js",
			"ci/cd": "CI/CD",
			cicd: "CI/CD",
			db: "Bases de datos",
			database: "Bases de datos",
		};

		if (aliases[normalized]) {
			return aliases[normalized];
		}

		return cleaned
			.replace(/[-_]+/g, " ")
			.replace(/\s+/g, " ")
			.trim()
			.split(" ")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(" ");
	};

	const getSubcategoryImage = (rawName: string) => {
		const normalized = rawName.toLowerCase();

		if (normalized.includes("html")) return "/icons/html.svg";
		if (normalized.includes("css")) return "/icons/css.svg";
		if (
			normalized.includes("javascript") ||
			normalized === "js" ||
			normalized.includes("node") ||
			normalized.includes("react") ||
			normalized.includes("typescript")
		)
			return "/icons/javascript.svg";

		return "/logo-96.webp";
	};

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/70">
			<div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-md relative">
				<button
					onClick={onClose}
					className="absolute top-3 right-3 text-muted hover:text-warn text-2xl font-bold focus:outline-none"
					aria-label="Cerrar"
				>
					×
				</button>
				<h2 className="text-xl font-bold mb-4 text-center">{category}</h2>
				{loading ? (
					<p className="text-center text-muted">
						Cargando subcategorias...
					</p>
				) : (
					<>
						{error ? (
							<p className="text-sm text-warn text-center mb-3">{error}</p>
						) : null}
						{subcategories.length === 0 ? (
							<p className="text-center text-muted">
								No hay subcategorias disponibles para esta categoria.
							</p>
						) : (
							<>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
									{subcategories.map((sub) => (
										<button
											key={sub.slug}
											className={`w-full flex items-center gap-3 px-3 py-3 rounded border transition text-left ${
												selectedSubcategory === sub.name
													? "border-accent bg-accent-soft"
													: "border-line hover:bg-accent-soft"
											}`}
											onClick={() => setSelectedSubcategory(sub.name)}
										>
											<img
												src={getSubcategoryImage(sub.name)}
												alt={formatSubcategoryName(sub.name)}
												className="w-10 h-10 rounded-md object-contain bg-surface border border-line p-1"
											/>
											<div className="flex-1 min-w-0">
												<p className="font-medium text-fg truncate">
													{formatSubcategoryName(sub.name)}
												</p>
												<p className="text-xs text-muted">
													{sub.questionCount} preguntas disponibles
												</p>
											</div>
										</button>
									))}
								</div>

								<div className="mb-4">
									<label className="block text-sm font-medium text-muted mb-1">
										Numero de preguntas
									</label>
									<select
										className="w-full border border-line rounded px-3 py-2"
										value={count}
										onChange={(e) => setCount(Number(e.target.value))}
										disabled={!selectedSubcategory || countOptions.length === 0}
									>
										{countOptions.map((option) => (
											<option key={option} value={option}>
												{option} preguntas
											</option>
										))}
									</select>
								</div>

								<button
									className="w-full bg-accent hover:bg-accent/90 text-accent-fg py-2 rounded disabled:opacity-50"
									onClick={() => onStartQuiz(selectedSubcategory, count)}
									disabled={!selectedSubcategory || countOptions.length === 0}
								>
									Empezar quiz
								</button>
							</>
						)}
					</>
				)}
			</div>
		</div>
	);
}
