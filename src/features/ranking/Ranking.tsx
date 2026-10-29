import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../services/auth";
import LeagueTable from "./LeagueTable";

type Resultado = {
	id?: string;
	name: string | null;
	score: number;
	total: number;
	category: string;
	subcategory?: string;
	legacySubcategory?: string | null;
	timestamp?: string;
};

const RANKING_COLUMNS =
	"id, name, score, total, category, subcategory, legacySubcategory:summary->0->>subcategory, timestamp";

const displayName = (r: Resultado) => r.name?.trim() || "Anónimo";

export default function Ranking() {
	const { isAuthenticated, isLoading: authLoading } = useAuth();
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

	useEffect(() => {
		if (!isAuthenticated) return;
		const cargarResultados = async () => {
			setQueryError(null);
			const [
				{ data: top, error: topError },
				{ data: recent, error: recentError },
			] = await Promise.all([
				supabase
					.from("resultados")
					.select(RANKING_COLUMNS)
					.order("score", { ascending: false })
					.limit(200),
				supabase
					.from("resultados")
					.select(RANKING_COLUMNS)
					.order("timestamp", { ascending: false })
					.limit(20),
			]);

			if (topError || recentError) {
				setQueryError(
					topError?.message ||
						recentError?.message ||
						"No se pudo cargar el ranking."
				);
			}
			// Ordenar por porcentaje (y a igualdad, por nº de preguntas):
			// un 5/5 debe quedar por encima de un 7/20.
			setResultados(
				((top ?? []) as Resultado[])
					.filter((r) => r.total > 0)
					.sort(
						(a, b) => b.score / b.total - a.score / a.total || b.total - a.total
					)
			);
			setRecientes((recent ?? []) as Resultado[]);
			setLoading(false);
		};

		cargarResultados();
	}, [isAuthenticated]);

	const getSubcategory = (resultado: Resultado) => {
		const raw = resultado.subcategory ?? resultado.legacySubcategory;

		if (!raw) return "Sin subcategoría";

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
			displayName(resultado).toLowerCase().includes(normalizedFilter) ||
			resultado.category.toLowerCase().includes(normalizedFilter) ||
			getSubcategory(resultado).toLowerCase().includes(normalizedFilter)
		);
	};

	if (authLoading) {
		return <p className="p-6 text-center">Cargando...</p>;
	}

	if (!isAuthenticated) {
		return (
			<p className="p-6 text-center text-warn font-semibold">
				Debes iniciar sesión para ver el ranking.
			</p>
		);
	}

	return (
		<>
			<section className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
				{queryError && (
					<p className="mb-4 text-center text-warn bg-warn-soft border border-warn/40 rounded p-2">
						{queryError}
					</p>
				)}
				<h1 className="sr-only">Ranking</h1>
				<LeagueTable />
				<h2 className="text-2xl font-bold mb-4 text-center">Ranking general</h2>
				<h3 className="text-lg font-semibold mb-2 text-center">
					🏆 Mejores puntajes
				</h3>
				<div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
					<div className="flex gap-4 justify-center">
						<button
							className={`px-4 py-2 rounded font-bold border transition ${
								topCount === 5
									? "bg-accent text-accent-fg border-accent"
									: "bg-surface text-accent border-accent/50 hover:bg-accent-soft"
							}`}
							onClick={() => setTopCount(5)}
						>
							Top 5
						</button>
						<button
							className={`px-4 py-2 rounded font-bold border transition ${
								topCount === 10
									? "bg-accent text-accent-fg border-accent"
									: "bg-surface text-accent border-accent/50 hover:bg-accent-soft"
							}`}
							onClick={() => setTopCount(10)}
						>
							Top 10
						</button>
					</div>
					<input
						type="text"
						className="border px-3 py-2 rounded w-full md:w-64"
						placeholder="Filtrar por nombre, categoría o subcategoría..."
						value={rankingFilter}
						onChange={(e) => setRankingFilter(e.target.value)}
					/>
				</div>
				{loading ? (
					<p className="text-center">Cargando...</p>
				) : (
					<div className="-mx-4 mb-8 overflow-x-auto sm:mx-0" tabIndex={0} role="region" aria-label="Tabla de mejores puntajes (desplazable)">
						<table className="w-full min-w-[40rem] table-auto border">
							<thead>
								<tr className="bg-surface2 text-left">
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
											key={res.id ?? i}
											className={`border-t ${
												i === 0
													? "bg-warn-soft font-extrabold text-fg"
													: i === 1
													? "bg-surface2 font-bold text-fg"
													: i === 2
													? "bg-warn-soft font-semibold text-warn"
													: ""
											}`}
										>
											<td className="p-2">
												{i + 1}
												{i === 0 && " 🥇"}
												{i === 1 && " 🥈"}
												{i === 2 && " 🥉"}
											</td>
											<td className="p-2">{displayName(res)}</td>
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
						placeholder="Filtrar por nombre, categoría o subcategoría..."
						value={recientesFilter}
						onChange={(e) => setRecientesFilter(e.target.value)}
					/>
				</div>
				{loading ? (
					<p className="text-center">Cargando...</p>
				) : (
					<>
						<div className="-mx-4 overflow-x-auto sm:mx-0" tabIndex={0} role="region" aria-label="Tabla de resultados recientes (desplazable)">
							<table className="w-full min-w-[40rem] table-auto border">
								<thead>
									<tr className="bg-surface2 text-left">
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
											recientesPage * recientesPerPage
										)
										.map((res, i) => (
											<tr key={res.id ?? i} className="border-t">
												<td className="p-2">
													{res.timestamp
														? new Date(res.timestamp).toLocaleString()
														: ""}
												</td>
												<td className="p-2">{displayName(res)}</td>
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
								className="px-3 py-1 rounded bg-surface2 text-muted font-bold disabled:opacity-50"
								onClick={() => setRecientesPage((p) => Math.max(1, p - 1))}
								disabled={recientesPage === 1}
							>
								Anterior
							</button>
							<span className="px-2 py-1 font-semibold">
								Página {recientesPage} de {Math.max(1, recientesTotalPages)}
							</span>
							<button
								className="px-3 py-1 rounded bg-surface2 text-muted font-bold disabled:opacity-50"
								onClick={() =>
									setRecientesPage((p) => Math.min(recientesTotalPages, p + 1))
								}
								disabled={recientesPage >= recientesTotalPages}
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
