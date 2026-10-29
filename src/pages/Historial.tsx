import { useEffect, useState } from "react";
import { useAuth } from "../services/auth";
import { supabase } from "../services/supabase";
import { Link } from "react-router-dom";

// Tipos para ambos historiales

type Envio = {
	code: string;
	language: string;
	timestamp: string;
};

type Test = {
	category: string;
	score: number;
	total: number;
	timestamp: string;
};

export default function Historial() {
	const { isAuthenticated, user } = useAuth();
	const [loading, setLoading] = useState(false);
	const [envios, setEnvios] = useState<Envio[]>([]);
	const [tests, setTests] = useState<Test[]>([]);
	const [tipo, setTipo] = useState<"test" | "codigo" | null>(null);
	const [testPage, setTestPage] = useState(1);
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [expandedEnvio, setExpandedEnvio] = useState<number | null>(null);
	const testsPerPage = 5;
	const testTotalPages = Math.ceil(tests.length / testsPerPage);

	// Modificar el efecto para incluir la categoría en el filtro correctamente
	useEffect(() => {
		if (!user || !tipo) return;
		setLoading(true);
		if (tipo === "codigo") {
			const cargarEnvios = async () => {
				const query = supabase
					.from("envios_codigo")
					.select("*")
					.eq("userId", user.id)
					.order("timestamp", { ascending: false });
				const { data } = await query;
				setEnvios((data ?? []) as Envio[]);
				setLoading(false);
			};
			cargarEnvios();
		} else if (tipo === "test") {
			const cargarTests = async () => {
				const query = supabase
					.from("resultados")
					.select("*")
					.eq("userId", user.id)
					.order("timestamp", { ascending: false });
				const { data } = await query;
				setTests((data ?? []) as Test[]);
				setLoading(false);
			};
			cargarTests();
		}
	}, [user, tipo]);

	// Agregar filtro por categoría para historial de código
	const filteredEnvios = selectedCategory
		? envios.filter((e) => e.language === selectedCategory)
		: envios;

	const filteredTests = selectedCategory
		? tests.filter((t) => t.category === selectedCategory)
		: tests;

	if (!isAuthenticated) {
		return (
			<p className="p-6 text-center">
				Debes iniciar sesión para ver tu historial.
			</p>
		);
	}

	if (!tipo) {
		return (
			<section className="max-w-2xl mx-auto p-6 text-center">
				<h2 className="text-2xl font-bold mb-6">¿Qué historial deseas ver?</h2>
				<div className="flex flex-col md:flex-row gap-4 justify-center">
					<button
						className="px-6 py-3 bg-accent text-accent-fg rounded hover:bg-accent/90 font-semibold"
						onClick={() => setTipo("test")}
					>
						Historial de Quiz
					</button>
					<button
						className="px-6 py-3 bg-accent text-accent-fg rounded hover:bg-accent/90 font-semibold"
						onClick={() => setTipo("codigo")}
					>
						Historial de Código
					</button>
				</div>
			</section>
		);
	}

	return (
		<>
			<section className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
				<h2 className="text-2xl font-bold mb-4 text-center">
					{tipo === "test" ? "Historial de Quizzes" : "Historial de Código"}
				</h2>
				<div className="flex justify-center mb-6">
					<button
						className="px-4 py-2 bg-surface2 rounded hover:bg-line text-muted mr-2"
						onClick={() => setTipo(null)}
					>
						Cambiar tipo de historial
					</button>
				</div>
				{tipo === "test" && (
					<div className="mb-6">
						<label
							htmlFor="category"
							className="block text-sm font-medium mb-2"
						>
							Filtrar por categoría:
						</label>
						<select
							id="category"
							className="w-full p-2 border rounded"
							value={selectedCategory || ""}
							onChange={(e) => setSelectedCategory(e.target.value || null)}
						>
							<option value="">Todas las categorías</option>
							{[...new Set(tests.map((t) => t.category))].map((category) => (
								<option key={category} value={category}>
									{category}
								</option>
							))}
						</select>
					</div>
				)}
				{tipo === "codigo" && (
					<div className="mb-6">
						<label
							htmlFor="language"
							className="block text-sm font-medium mb-2"
						>
							Filtrar por lenguaje:
						</label>
						<select
							id="language"
							className="w-full p-2 border rounded"
							value={selectedCategory || ""}
							onChange={(e) => setSelectedCategory(e.target.value || null)}
						>
							<option value="">Todos los lenguajes</option>
							{[...new Set(envios.map((e) => e.language))].map((language) => (
								<option key={language} value={language}>
									{language.toUpperCase()}
								</option>
							))}
						</select>
					</div>
				)}
				{loading ? (
					<p className="text-center">Cargando...</p>
				) : tipo === "codigo" ? (
					filteredEnvios.length === 0 ? (
						<p className="text-center">Aún no has guardado ningún código.</p>
					) : (
						<ul className="space-y-4">
							{filteredEnvios
								.slice((testPage - 1) * testsPerPage, testPage * testsPerPage)
								.map((e, i) => (
									<li key={i} className="border p-4 rounded bg-surface2">
										<div
											className="cursor-pointer flex justify-between items-center"
											onClick={() =>
												setExpandedEnvio(expandedEnvio === i ? null : i)
											}
										>
											<p className="text-sm text-muted">
												{new Date(e.timestamp).toLocaleString()} —{" "}
												{e.language?.toUpperCase()}
											</p>
											<span className="text-accent underline text-sm hover:text-accent/80">
												{expandedEnvio === i ? "Cerrar" : "Abrir"}
											</span>
										</div>
										{expandedEnvio === i && (
											<div className="mt-2">
												<pre className="bg-surface p-2 rounded text-sm overflow-auto max-h-40">
													{e.code}
												</pre>
												<div className="mt-2 text-right">
													<Link
														to={`/editor?language=${encodeURIComponent(
															e.language
														)}&code=${encodeURIComponent(e.code)}`}
														className="text-accent underline text-sm hover:text-accent/80"
													>
														Abrir en editor
													</Link>
												</div>
											</div>
										)}
									</li>
								))}
						</ul>
					)
				) : filteredTests.length === 0 ? (
					<p className="text-center">Aún no has guardado ningún test.</p>
				) : (
					<ul className="space-y-4">
						{filteredTests
							.slice((testPage - 1) * testsPerPage, testPage * testsPerPage)
							.map((t, i) => (
								<li key={i} className="border p-4 rounded bg-surface2">
									<p className="text-sm text-muted mb-1">
										{new Date(t.timestamp).toLocaleString()}
									</p>
									<div className="flex flex-col md:flex-row md:justify-between md:items-center">
										<span className="font-semibold">
											Categoría: {t.category || "N/A"}
										</span>
										<span className="font-semibold">
											Puntaje: {t.score ?? "-"} / {t.total ?? "-"}
										</span>
									</div>
								</li>
							))}
					</ul>
				)}
				{/* Paginación para historial de tests */}
				{tipo === "test" && testTotalPages > 1 && (
					<div className="flex justify-center gap-2 mt-4">
						<button
							className="px-3 py-1 rounded bg-surface2 text-muted font-bold disabled:opacity-50"
							onClick={() => setTestPage((p) => Math.max(1, p - 1))}
							disabled={testPage === 1}
						>
							Anterior
						</button>
						<span className="px-2 py-1 font-semibold">
							Página {testPage} de {testTotalPages}
						</span>
						<button
							className="px-3 py-1 rounded bg-surface2 text-muted font-bold disabled:opacity-50"
							onClick={() =>
								setTestPage((p) => Math.min(testTotalPages, p + 1))
							}
							disabled={testPage === testTotalPages}
						>
							Siguiente
						</button>
					</div>
				)}
				{/* Paginación para historial de código */}
				{tipo === "codigo" && filteredEnvios.length > testsPerPage && (
					<div className="flex justify-center gap-2 mt-4">
						<button
							className="px-3 py-1 rounded bg-surface2 text-muted font-bold disabled:opacity-50"
							onClick={() => setTestPage((p) => Math.max(1, p - 1))}
							disabled={testPage === 1}
						>
							Anterior
						</button>
						<span className="px-2 py-1 font-semibold">
							Página {testPage} de{" "}
							{Math.ceil(filteredEnvios.length / testsPerPage)}
						</span>
						<button
							className="px-3 py-1 rounded bg-surface2 text-muted font-bold disabled:opacity-50"
							onClick={() =>
								setTestPage((p) =>
									Math.min(
										Math.ceil(filteredEnvios.length / testsPerPage),
										p + 1
									)
								)
							}
							disabled={
								testPage === Math.ceil(filteredEnvios.length / testsPerPage)
							}
						>
							Siguiente
						</button>
					</div>
				)}
			</section>
		</>
	);
}
