import {
	PieChart,
	Pie,
	Cell,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";

type PerformanceChartProps = {
	data: { category: string; average: number }[];
	title?: string;
	centerLabel?: string;
};

// Paleta categórica del sistema de diseño (variables --chart-N en styles/index.css)
const COLORS = [1, 2, 3, 4, 5].map((n) => `rgb(var(--chart-${n}))`);

const RADIAN = Math.PI / 180;

type SliceLabelProps = {
	cx: number;
	cy: number;
	midAngle: number;
	innerRadius: number;
	outerRadius: number;
	value: number;
};

function SliceLabel({
	cx,
	cy,
	midAngle,
	innerRadius,
	outerRadius,
	value,
}: SliceLabelProps) {
	const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
	const x = cx + radius * Math.cos(-midAngle * RADIAN);
	const y = cy + radius * Math.sin(-midAngle * RADIAN);

	return (
		<text
			x={x}
			y={y}
			fill="rgb(var(--bg))"
			textAnchor="middle"
			dominantBaseline="central"
			fontSize={12}
			fontWeight={600}
		>
			{value}
		</text>
	);
}

export default function PerformanceChart({
	data,
	title = "Rendimiento",
	centerLabel,
}: PerformanceChartProps) {
	if (!data || data.length === 0) {
		return (
			<div className="bg-surface p-6 rounded-xl border border-line text-center text-muted">
				Sin datos para mostrar
			</div>
		);
	}

	const label = centerLabel ?? title;
	const lines = label.split(" ");

	return (
		<div className="bg-surface p-6 rounded-xl border border-line">
			{/* Contenedor relativo para superponer el texto central */}
			<div className="relative">
				<ResponsiveContainer width="100%" height={300}>
					<PieChart>
						<Pie
							data={data}
							dataKey="average"
							nameKey="category"
							cx="50%"
							cy="50%"
							innerRadius={65}
							outerRadius={110}
							labelLine={false}
							label={(props) => <SliceLabel {...props} />}
						>
							{data.map((_, index) => (
								<Cell
									key={`cell-${index}`}
									fill={COLORS[index % COLORS.length]}
								/>
							))}
						</Pie>
						<Tooltip
							formatter={(value: number) => [`${value} / 10`, "Promedio"]}
							contentStyle={{
								background: "rgb(var(--surface))",
								border: "1px solid rgb(var(--border))",
								borderRadius: 10,
								color: "rgb(var(--text))",
							}}
						/>
						<Legend />
					</PieChart>
				</ResponsiveContainer>

				{/* Texto superpuesto en el centro del hoyo — pb-8 compensa la leyenda inferior */}
				<div className="absolute inset-0 flex flex-col items-center justify-center pb-8 pointer-events-none">
					{lines.map((line, i) => (
						<span
							key={i}
							className="block text-sm font-bold text-fg leading-tight text-center"
						>
							{line}
						</span>
					))}
				</div>
			</div>
		</div>
	);
}
