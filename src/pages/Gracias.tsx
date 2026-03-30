import { Link } from "react-router-dom";

export default function Gracias() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-white">
      <h2 className="text-3xl font-bold text-green-600 mb-4">
        ¡Gracias por tu mensaje!
      </h2>
      <p className="text-lg text-gray-700">
        Hemos recibido tu mensaje correctamente. Te responderemos lo antes
        posible.
      </p>
      <Link
        to="/"
        className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
