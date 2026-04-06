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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];

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
			fill="white"
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
			<div className="bg-white p-6 rounded shadow text-center text-slate-400">
				Sin datos para mostrar
			</div>
		);
	}

	const label = centerLabel ?? title;
	const lines = label.split(" ");

	return (
		<div className="bg-white p-6 rounded shadow">
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
						/>
						<Legend />
					</PieChart>
				</ResponsiveContainer>

				{/* Texto superpuesto en el centro del hoyo — pb-8 compensa la leyenda inferior */}
				<div className="absolute inset-0 flex flex-col items-center justify-center pb-8 pointer-events-none">
					{lines.map((line, i) => (
						<span
							key={i}
							className="block text-sm font-bold text-slate-800 leading-tight text-center"
						>
							{line}
						</span>
					))}
				</div>
			</div>
		</div>
	);
}
