// src/pages/HistoryPage.tsx
import { useUserHistory } from "@/hooks/useUserHistory";

type HistoryItem = {
  id: string;
  category: string;
  createdAt: string;
  score: number;
  total: number;
};

export default function HistoryPage() {
  const { history, loading } = useUserHistory();

  if (loading) return <p className="p-6 text-center">Cargando historial...</p>;

  // Forzar tipado correcto para evitar error TS2345
  const typedHistory = history as HistoryItem[];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Historial</h1>
      {typedHistory.length === 0 ? (
        <p>No hay historial disponible.</p>
      ) : (
        <ul className="space-y-4">
          {typedHistory.map((item) => (
            <li
              key={item.id}
              className="p-4 bg-white shadow rounded flex justify-between items-center"
            >
              <div>
                <p className="text-lg font-semibold">{item.category}</p>
                <p className="text-sm text-gray-600">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="font-bold">
                  {item.score}/{item.total}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
