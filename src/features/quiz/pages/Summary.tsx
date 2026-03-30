import { useLocation, useNavigate } from "react-router-dom";

type QuestionSummary = {
  question: string;
  options: string[]; // Agregado para poder mostrar el texto de la respuesta
  selected: string | number;
  correctAnswer: string | number;
  selectedAnswer?: string | number; // Permitir ambos por compatibilidad
};

export default function Summary() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const summary: QuestionSummary[] = state?.summary;

  if (!summary || !summary.length) {
    return <p className="p-6 text-center">No hay respuestas para mostrar.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Resumen de respuestas
      </h2>

      <ul className="space-y-4">
        {summary.map((item, index) => {
          // Compatibilidad: usar selectedAnswer si existe, si no selected
          const userAnswerRaw = item.selectedAnswer ?? item.selected;

          // Si la respuesta seleccionada es un índice, mostrar el texto
          let userAnswerText = userAnswerRaw;
          if (
            typeof userAnswerRaw === "number" &&
            Array.isArray(item.options)
          ) {
            userAnswerText = item.options[userAnswerRaw] ?? userAnswerRaw;
          }

          // Si correctAnswer es un número, obtener el texto de options
          let correctAnswerText = item.correctAnswer;
          if (
            typeof item.correctAnswer === "number" &&
            Array.isArray(item.options)
          ) {
            correctAnswerText =
              item.options[item.correctAnswer] ?? item.correctAnswer;
          }

          // Comparar por texto real, no por valor crudo
          const isCorrect =
            String(userAnswerText) === String(correctAnswerText);

          return (
            <li
              key={index}
              className={`border rounded p-4 ${
                isCorrect
                  ? "border-green-500 bg-green-50"
                  : "border-red-500 bg-red-50"
              }`}
            >
              <p className="font-semibold mb-2">Pregunta {index + 1}:</p>
              <p className="mb-1">{item.question}</p>
              <p>
                <strong>Tu respuesta:</strong>{" "}
                <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                  {String(userAnswerText)}
                </span>
              </p>
              {!isCorrect && (
                <p>
                  <strong>Respuesta correcta:</strong>{" "}
                  <span className="text-green-700">
                    {String(correctAnswerText)}
                  </span>
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <div className="text-center mt-8">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Volver
        </button>
      </div>
    </div>
  );
}
