import { useLocation, useNavigate } from "react-router-dom";

type AnswerSummary = {
  question: string;
  options: string[];
  correctAnswer: string;
  selectedAnswer: string;
  shortExplanation?: string;
  sourceUrl?: string;
  sourceName?: string;
  id?: string; // opcional si no se usa en el resumen
};

export default function QuestionSummary() {
  const navigate = useNavigate();
  const location = useLocation();

  const { summary } = location.state || { summary: [] };

  if (!summary || summary.length === 0) {
    return (
      <div className="p-6 text-center">
        <p>No hay resumen disponible.</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => navigate(-1)}
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Resumen del quiz</h2>
      <ul className="space-y-6">
        {summary.map((item: AnswerSummary, index: number) => {
          const isCorrect = item.selectedAnswer === item.correctAnswer;
          return (
            <li key={index} className="border rounded p-4 shadow">
              <p className="font-semibold mb-2">
                {index + 1}. {item.question}
              </p>
              <div className="space-y-1">
                {item.options.map((option, i) => {
                  let bg = "bg-white";
                  if (option === item.correctAnswer) bg = "bg-green-100";
                  if (option === item.selectedAnswer && !isCorrect)
                    bg = "bg-red-100";

                  return (
                    <div key={i} className={`px-3 py-1 rounded ${bg} border`}>
                      {option}
                      {option === item.selectedAnswer && " (tu respuesta)"}
                      {option === item.correctAnswer && " (correcta)"}
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-6 text-center">
        <button
          className="px-6 py-2 bg-blue-600 text-white rounded"
          onClick={() => navigate(-1)}
        >
          Volver
        </button>
      </div>
    </div>
  );
}
