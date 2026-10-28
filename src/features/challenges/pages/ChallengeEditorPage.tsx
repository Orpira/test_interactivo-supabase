import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Editor from "@/features/editor/Editor";
import { useChallengeStore } from "@/store/challengeStore";

export default function ChallengeEditorPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { challenges, loading, loaded, fetchChallenges } = useChallengeStore();
	const [solved, setSolved] = useState(false);

	useEffect(() => {
		if (!loaded) fetchChallenges();
	}, [loaded, fetchChallenges]);

	useEffect(() => setSolved(false), [id]);

	const challenge = challenges.find((c) => c.id === id);

	if (loading || !loaded)
		return <p className="p-6 text-center">Cargando reto...</p>;
	if (!challenge)
		return (
			<div className="p-6 text-center space-y-3">
				<p>Reto no encontrado.</p>
				<Link to="/editor" className="text-indigo-600 underline">
					Ver todos los retos
				</Link>
			</div>
		);

	const siblings = challenges.filter((c) => c.category === challenge.category);
	const index = siblings.findIndex((c) => c.id === challenge.id);
	const prev = siblings[index - 1];
	const next = siblings[index + 1];
	const goTo = (target?: { id: string; category: string }) =>
		target && navigate(`/editor/${target.category}/${target.id}`);

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
			<nav className="mb-3 text-sm text-gray-600" aria-label="Migas de pan">
				<Link to="/editor" className="hover:underline">
					Retos
				</Link>{" "}
				/{" "}
				<Link
					to={`/editor?categoria=${challenge.category}`}
					className="hover:underline"
				>
					{challenge.category.toUpperCase()}
				</Link>{" "}
				/ {index + 1} de {siblings.length}
			</nav>

			<h1 className="mb-2 text-2xl font-bold">{challenge.title}</h1>
			<p className="mb-4 whitespace-pre-line text-gray-700">
				{challenge.instructions}
			</p>

			<Editor
				challengeId={challenge.id}
				starterCode={challenge.initialCode || challenge.starterCode || ""}
				categoryFromChallenge={challenge.category}
				expectedOutput={challenge.expectedOutput}
				onSolved={() => setSolved(true)}
			/>

			<div className="mt-8 flex items-center justify-between gap-3">
				<button
					type="button"
					onClick={() => goTo(prev)}
					disabled={!prev}
					className="rounded bg-gray-200 px-4 py-2 font-semibold text-gray-700 disabled:opacity-40"
				>
					← Anterior
				</button>
				<button
					type="button"
					onClick={() => goTo(next)}
					disabled={!next}
					className={`rounded px-4 py-2 font-semibold text-white disabled:opacity-40 ${
						solved ? "bg-indigo-600 animate-pulse" : "bg-indigo-500"
					}`}
				>
					Siguiente reto →
				</button>
			</div>
		</div>
	);
}
