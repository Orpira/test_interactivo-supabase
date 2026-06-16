import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../services/auth";
import { useQuizStore } from "../../store/quizStore";

type Resultado = {
	name: string;
	email: string;
	score: number;
	total: number;
	category: string;
	subcategory?: string;
	subcategoria?: string;
	summary?: Array<{ subcategory?: string; subcategoria?: string }>;
	timestamp?: string;
};

export default function Ranking() {
	const { isAuthenticated } = useAuth();
	const [resultados, setResultados] = useState<Resultado[]>([]);
	const [recientes, setRecientes] = useState<Resultado[]>([]);
	const [loading, setLoading] = useState(true);
	const [topCount, setTopCount] = useState(5);
	const [recientesPage, setRecientesPage] = useState(1);
	const [rankingFilter, setRankingFilter] = useState("");
	const [recientesFilter, setRecientesFilter] = useState("");
	const [queryError, setQueryError] = useState<string | null>(null);
	const recientesPerPage = 5;
	const recientesTotalPages = Math.ceil(recientes.length / recientesPerPage);
	const navigate = useNavigate();

	useEffect(() => {
		const cargarResultados = async () => {
			setQueryError(null);
			const [
				{ data: top, error: topError },
				{ data: recent, error: recentError },
			] = await Promise.all([
				supabase
					.from("resultados")
					.select("*")
					.order("score", { ascending: false })
					.limit(20),
				supabase
					.from("resultados")
					.select("*")
					.order("timestamp", { ascending: false })
					.limit(20),
			]);

			if (topError || recentError) {
				setQueryError(
					topError?.message ||
						recentError?.message ||
						"No se pudo cargar el ranking.",
				);
			}
			setResultados((top ?? []) as Resultado[]);
			setRecientes((recent ?? []) as Resultado[]);
			setLoading(false);
		};

		cargarResultados();
	}, []);

	const getSubcategory = (resultado: Resultado) => {
		const raw =
			resultado.subcategory ??
			resultado.subcategoria ??
			resultado.summary?.[0]?.subcategory ??
			resultado.summary?.[0]?.subcategoria;

		if (!raw) return "Sin subcategoria";

		try {
			return decodeURIComponent(raw);
		} catch {
			return raw;
		}
	};

	const matchesRankingFilter = (resultado: Resultado, filter: string) => {
		const normalizedFilter = filter.toLowerCase();
		if (!normalizedFilter) return true;

		return (
			(resultado.name || resultado.email)
				.toLowerCase()
				.includes(normalizedFilter) ||
			resultado.category.toLowerCase().includes(normalizedFilter) ||
			getSubcategory(resultado).toLowerCase().includes(normalizedFilter)
		);
	};

	if (!isAuthenticated) {
		return (
			<p className="p-6 text-center text-red-600 font-semibold">
				Debes iniciar sesión para ver el ranking.
			</p>
		);
	}

	const result = useQuizStore((state) => state.result);

	return (
		<>
			<section className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
				{queryError && (
					<p className="mb-4 text-center text-red-600 bg-red-50 border border-red-200 rounded p-2">
						{queryError}
					</p>
				)}
				<h2 className="text-2xl font-bold mb-4 text-center">Ranking general</h2>
				<h3 className="text-lg font-semibold mb-2 text-center">
					🏆 Mejores puntajes
				</h3>
				<div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
					<div className="flex gap-4 justify-center">
						<button
							className={`px-4 py-2 rounded font-bold border transition ${
								topCount === 5
									? "bg-blue-600 text-white border-blue-700"
									: "bg-white text-blue-700 border-blue-300 hover:bg-blue-100"
							}`}
							onClick={() => setTopCount(5)}
						>
							Top 5
						</button>
						<button
							className={`px-4 py-2 rounded font-bold border transition ${
								topCount === 10
									? "bg-blue-600 text-white border-blue-700"
									: "bg-white text-blue-700 border-blue-300 hover:bg-blue-100"
							}`}
							onClick={() => setTopCount(10)}
						>
							Top 10
						</button>
					</div>
					<input
						type="text"
						className="border px-3 py-2 rounded w-full md:w-64"
						placeholder="Filtrar por nombre, categoria, subcategoria o email..."
						value={rankingFilter}
						onChange={(e) => setRankingFilter(e.target.value)}
					/>
				</div>
				{loading ? (
					<p className="text-center">Cargando...</p>
				) : (
					<div className="-mx-4 mb-8 overflow-x-auto sm:mx-0">
						<table className="w-full min-w-[40rem] table-auto border">
							<thead>
								<tr className="bg-gray-100 text-left">
									<th className="p-2">#</th>
									<th className="p-2">Nombre</th>
									<th className="p-2">Categoría</th>
									<th className="p-2">Subcategoría</th>
									<th className="p-2">Puntuación</th>
									<th className="p-2">Porcentaje</th>
								</tr>
							</thead>
							<tbody>
								{resultados
									.filter((res) => matchesRankingFilter(res, rankingFilter))
									.slice(0, topCount)
									.map((res, i) => (
										<tr
											key={i}
											className={`border-t ${
												i === 0
													? "bg-yellow-100 font-extrabold text-blue-900"
													: i === 1
														? "bg-gray-200 font-bold text-gray-800"
														: i === 2
															? "bg-yellow-300 font-semibold text-yellow-900"
															: ""
											}`}
										>
											<td className="p-2">
												{i + 1}
												{i === 0 && " 🥇"}
												{i === 1 && " 🥈"}
												{i === 2 && " 🥉"}
											</td>
											<td className="p-2">{res.name || res.email}</td>
											<td className="p-2">{res.category.toUpperCase()}</td>
											<td className="p-2">{getSubcategory(res)}</td>
											<td className="p-2">
												{res.score} / {res.total}
											</td>
											<td className="p-2">
												{Math.round((res.score / res.total) * 100)}%
											</td>
										</tr>
									))}
							</tbody>
						</table>
					</div>
				)}
				<h3 className="text-lg font-semibold mb-2 text-center">
					🕒 Últimos resultados
				</h3>
				<div className="flex justify-end mb-2">
					<input
						type="text"
						className="border px-3 py-2 rounded w-full md:w-64"
						placeholder="Filtrar por nombre, categoria, subcategoria o email..."
						value={recientesFilter}
						onChange={(e) => setRecientesFilter(e.target.value)}
					/>
				</div>
				{loading ? (
					<p className="text-center">Cargando...</p>
				) : (
					<>
						<div className="-mx-4 overflow-x-auto sm:mx-0">
							<table className="w-full min-w-[40rem] table-auto border">
								<thead>
									<tr className="bg-gray-100 text-left">
										<th className="p-2">Fecha</th>
										<th className="p-2">Nombre</th>
										<th className="p-2">Categoría</th>
										<th className="p-2">Subcategoría</th>
										<th className="p-2">Puntuación</th>
										<th className="p-2">Porcentaje</th>
									</tr>
								</thead>
								<tbody>
									{recientes
										.filter((res) => matchesRankingFilter(res, recientesFilter))
										.slice(
											(recientesPage - 1) * recientesPerPage,
											recientesPage * recientesPerPage,
										)
										.map((res, i) => (
											<tr key={i} className="border-t">
												<td className="p-2">
													{res.timestamp
														? new Date(res.timestamp).toLocaleString()
														: ""}
												</td>
												<td className="p-2">{res.name || res.email}</td>
												<td className="p-2">{res.category.toUpperCase()}</td>
												<td className="p-2">{getSubcategory(res)}</td>
												<td className="p-2">
													{res.score} / {res.total}
												</td>
												<td className="p-2">
													{Math.round((res.score / res.total) * 100)}%
												</td>
											</tr>
										))}
								</tbody>
							</table>{" "}
						</div>{" "}
						{/* Paginación */}
						<div className="flex justify-center gap-2 mt-4">
							<button
								className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-bold disabled:opacity-50"
								onClick={() => setRecientesPage((p) => Math.max(1, p - 1))}
								disabled={recientesPage === 1}
							>
								Anterior
							</button>
							<span className="px-2 py-1 font-semibold">
								Página {recientesPage} de {recientesTotalPages}
							</span>
							<button
								className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-bold disabled:opacity-50"
								onClick={() =>
									setRecientesPage((p) => Math.min(recientesTotalPages, p + 1))
								}
								disabled={recientesPage === recientesTotalPages}
							>
								Siguiente
							</button>
						</div>
					</>
				)}
			</section>
		</>
	);
}
