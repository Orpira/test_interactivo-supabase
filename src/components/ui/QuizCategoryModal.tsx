import React from "react";

export type QuizCategoryModalProps = {
	open: boolean;
	onClose: () => void;
	category: string;
	subcategories: { name: string; slug: string; questionCount: number }[];
	onStartQuiz: (subcategory: string) => void;
};

export default function QuizCategoryModal({
	open,
	onClose,
	category,
	subcategories,
	onStartQuiz,
}: QuizCategoryModalProps) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
			<div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
				<button
					onClick={onClose}
					className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-2xl font-bold focus:outline-none"
					aria-label="Cerrar"
				>
					×
				</button>
				<h2 className="text-xl font-bold mb-4 text-center">{category}</h2>
				<div className="space-y-3">
					{subcategories.map((sub) => (
						<button
							key={sub.slug}
							className="w-full flex justify-between items-center px-4 py-2 rounded border border-slate-200 hover:bg-indigo-50 transition text-left"
							onClick={() => onStartQuiz(sub.slug)}
						>
							<span>{sub.name}</span>
							<span className="text-xs text-slate-500 bg-slate-100 rounded px-2 py-0.5">
								{sub.questionCount} preguntas
							</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
