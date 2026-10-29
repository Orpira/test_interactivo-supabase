import { Link } from "react-router-dom";

export default function Gracias() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-surface">
      <h2 className="text-3xl font-bold text-accent mb-4">
        ¡Gracias por tu mensaje!
      </h2>
      <p className="text-lg text-muted">
        Hemos recibido tu mensaje correctamente. Te responderemos lo antes
        posible.
      </p>
      <Link
        to="/"
        className="mt-6 bg-accent text-accent-fg px-6 py-2 rounded hover:bg-accent/90 transition"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
