import { useState } from "react";
import { useAuth } from "../../services/auth";
import { useUserHistory, type HistoryItem } from "@/hooks/useUserHistory";
import PerformanceChart from "./PerformanceChart"; // Placeholder para el gráfico
import { useNavigate, Link } from "react-router-dom";
import { exportToCSV } from "../../utils/exportCSV";
import Achievements from "@/components/ui/Achievements"; // Componente no encontrado, import eliminado
import { calculateAchievements } from "../../utils/achievements";

export default function Dashboard() {
	const { user } = useAuth();
	const { history, loading, error: historyError } = useUserHistory();
	const navigate = useNavigate();
	const [historyFilter, setHistoryFilter] = useState("");

	const totalTests = history.length;
	const averageScore = history.length
		? (
				history.reduce((acc, h) => acc + h.score / h.total, 0) / history.length
		  ).toFixed(2)
		: 0;
	const lastTest = history[0];

	const averagesByCategory = history.reduce((acc, h) => {
		if (!acc[h.category]) {
			acc[h.category] = { total: 0, count: 0 };
		}
		acc[h.category].total += h.score / h.total;
		acc[h.category].count += 1;
		return acc;
	}, {} as Record<string, { total: number; count: number }>);

	const chartData = Object.entries(averagesByCategory).map(
		([category, { total, count }]) => ({
			category,
			average: Number(((total / count) * 10).toFixed(2)), // Escalado a 10
		})
	);

	const normalizeSubcategory = (value: string) => {
		try {
			return decodeURIComponent(value);
		} catch {
			return value;
		}
	};

	const getEntrySubcategory = (entry: HistoryItem) => {
		const raw =
			entry.subcategory ??
			entry.subcategoria ??
			entry.summary?.[0]?.subcategory ??
			entry.summary?.[0]?.subcategoria;
		if (!raw) return "Sin subcategoria";
		return normalizeSubcategory(String(raw));
	};

	const averagesBySubcategory = history.reduce((acc, h) => {
		const subcategory = getEntrySubcategory(h);
		if (!acc[subcategory]) {
			acc[subcategory] = { total: 0, count: 0 };
		}
		acc[subcategory].total += h.score / h.total;
		acc[subcategory].count += 1;
		return acc;
	}, {} as Record<string, { total: number; count: number }>);

	const subcategoryChartData = Object.entries(averagesBySubcategory).map(
		([subcategory, { total, count }]) => ({
			category: subcategory,
			average: Number(((total / count) * 10).toFixed(2)),
		})
	);

	const lastFive = [...history]
		.filter((entry) => {
			const normalizedFilter = historyFilter.toLowerCase();
			if (!normalizedFilter) return true;

			return (
				String(entry.category).toLowerCase().includes(normalizedFilter) ||
				getEntrySubcategory(entry).toLowerCase().includes(normalizedFilter)
			);
		})
		.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)) // más reciente primero
		.slice(0, 5);

	// Adaptar los datos de history (Firestore) al tipo TestResult para calculateAchievements
	const testResults = history.map((h) => ({
		userId: h.userId || "",
		date: h.timestamp || h.createdAt || "",
		score: h.score,
		total: h.total,
		category: h.category,
	}));

	const userAchievements = calculateAchievements(testResults);

	if (loading) {
		return <p className="p-6 text-center">Cargando tu dashboard...</p>;
	}

	return (
		<div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
			{historyError && (
				<p className="mb-4 text-center text-warn bg-warn-soft border border-warn/40 rounded p-2">
					{historyError}
				</p>
			)}
			<h1 className="text-3xl font-bold text-center mb-6">Tu Dashboard</h1>

			{/* Bienvenida */}
			<div className="mb-6 text-center">
				<p className="text-lg">
					Bienvenido/a,{" "}
					<strong>
						{user?.user_metadata?.full_name || user?.email || "usuario"}
					</strong>
				</p>
				<p className="text-sm text-muted">{user?.email}</p>
			</div>

			{/* Enlaces a Historial y Ranking */}
			<div className="flex justify-center gap-4 mb-6">
				<Link
					to="/historial"
					className="px-4 py-2 bg-accent text-accent-fg rounded hover:bg-accent/90 transition"
				>
					Historial
				</Link>
				<Link
					to="/ranking"
					className="px-4 py-2 bg-accent text-accent-fg rounded hover:bg-accent/90 transition"
				>
					Ranking
				</Link>
			</div>

			{/* Métricas principales */}
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
				<Card title="Quiz Realizados" value={totalTests} color="indigo" />
				<Card title="Promedio" value={`${averageScore} pts`} color="green" />
				<Card
					title="Último Quiz"
					value={lastTest?.category ?? "—"}
					color="blue"
				/>
				<Card
					title="Última puntuación"
					value={lastTest ? `${lastTest.score}/${lastTest.total}` : "—"}
					color="yellow"
				/>
			</div>

			{/* Gráficos lado a lado */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
				<div>
					<h2 className="text-xl font-bold text-center">
						Rendimiento por Categoría
					</h2>
					<p className="text-sm text-muted text-center mb-3">
						Promedio de aciertos (0–10) agrupado por categoría principal
					</p>
					<PerformanceChart
						data={chartData}
						title="Por categoría"
						centerLabel="Categoría"
					/>
				</div>
				<div>
					<h2 className="text-xl font-bold text-center">
						Rendimiento por Subcategoría
					</h2>
					<p className="text-sm text-muted text-center mb-3">
						Promedio de aciertos (0–10) desglosado por tema específico
					</p>
					<PerformanceChart
						data={subcategoryChartData}
						title="Por subcategoría"
						centerLabel="Sub categoría"
					/>
				</div>
			</div>

			{/* Escala de referencia compartida para ambos gráficos */}
			<div className="mb-8 flex flex-wrap justify-center gap-2 text-xs">
				<span className="text-muted font-medium self-center mr-1">
					Escala:
				</span>
				<span className="flex items-center gap-1 rounded-full bg-warn-soft px-3 py-1 text-warn font-medium">
					🔴 0–4 Bajo
				</span>
				<span className="flex items-center gap-1 rounded-full bg-warn-soft px-3 py-1 text-warn font-medium">
					🟡 5–6 Regular
				</span>
				<span className="flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1 text-accent font-medium">
					🟢 7–8 Bueno
				</span>
				<span className="flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1 text-accent font-medium">
					🌟 9–10 Excelente
				</span>
			</div>

			{/* Últimos 5 quiz */}
			<section className="bg-surface rounded shadow p-4">
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-2">
					<h3 className="text-lg font-semibold">🕒 Últimos 5 quiz</h3>
					<input
						type="text"
						className="border px-3 py-2 rounded w-full md:w-72"
						placeholder="Filtrar por categoria o subcategoria..."
						value={historyFilter}
						onChange={(e) => setHistoryFilter(e.target.value)}
					/>
				</div>
				<div className="-mx-4 overflow-x-auto sm:mx-0">
					<table className="w-full min-w-[36rem] text-left text-sm">
						<thead>
							<tr className="border-b font-medium">
								<th className="p-2">Categoría</th>
								<th className="p-2">Subcategoría</th>
								<th className="p-2">Fecha</th>
								<th className="p-2">Puntaje</th>
								<th className="p-2">Detalles</th>
							</tr>
						</thead>
						<tbody>
							{lastFive.map((entry, i) => (
								<tr key={i} className="border-b hover:bg-surface2">
									<td className="p-2">{entry.category}</td>
									<td className="p-2">{getEntrySubcategory(entry)}</td>
									<td className="whitespace-nowrap p-2">
										{new Date(entry.timestamp).toLocaleString()}
									</td>
									<td className="p-2">
										{entry.score} / {entry.total}
									</td>
									<td className="p-2">
										<button
											className="text-accent hover:underline text-sm"
											onClick={() => navigate(`/result?id=${entry.id}`)}
										>
											Ver
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>

			{/* Ejemplo de logros, reemplaza esto con la lógica real si la tienes */}
			<Achievements achievements={userAchievements} />
			<button
				onClick={() =>
					exportToCSV(
						history.map((h) => ({
							fecha: h.timestamp,
							categoria: h.category,
							subcategoria: getEntrySubcategory(h),
							aciertos: h.score,
							total: h.total,
							porcentaje: h.total ? Math.round((h.score / h.total) * 100) : 0,
						})),
						"historial_test"
					)
				}
				className="mt-4 px-4 py-2 bg-accent text-accent-fg rounded hover:bg-accent/90"
			>
				Exportar historial (.CSV)
			</button>
		</div>
	);
}

function Card({ title, value, color }: CardProps) {
	return (
		<div
			className={`bg-${color}-100 text-${color}-800 p-4 rounded shadow text-center`}
		>
			<p className="text-sm font-medium mb-1">{title}</p>
			<p className="text-xl font-bold">{value}</p>
		</div>
	);
}

type CardProps = {
	title: string;
	value: string | number;
	color: string;
};
