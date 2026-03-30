import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";

type PerformanceChartProps = {
  data: { category: string; average: number }[];
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];

export default function PerformanceChart({ data }: PerformanceChartProps) {
  return (
    <div className="bg-white p-6 rounded shadow">
      <h3 className="text-lg font-bold mb-4 text-center">
        Rendimiento por categoría
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="category" />
          <YAxis domain={[0, 10]} />
          <Tooltip />
          <Bar dataKey="average" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
