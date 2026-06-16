import React from "react";
import { PropsWithChildren } from "react";

type AuthModalProps = {
  /** Controla la visibilidad del modal */
  open: boolean;
  /** Acción al hacer clic en “Iniciar sesión” */
  onLogin: () => void;
  /** Acción al cerrar / cancelar */
  onClose: () => void;
};

export default function AuthModal({
  open,
  onLogin,
  onClose,
}: PropsWithChildren<AuthModalProps>) {
  if (!open) return null; // No renderiza nada si no está abierto

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-20 px-4">
      <div className="bg-white text-gray-800 rounded-lg shadow-xl p-6 w-full max-w-xs sm:max-w-sm md:max-w-md text-center sm:p-8">
        <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
          Bienvenido a la sección de Retos
        </h3>
        <p className="mb-5 sm:mb-6 text-sm sm:text-base">
          Para acceder a Retos, debes iniciar sesión. <br />
          Módulo aún en desarrollo, pronto disponible.!!!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <button
            className="px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
            onClick={onLogin}
          >
            Iniciar sesión
          </button>
          <button
            className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm sm:text-base w-full sm:w-auto"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
