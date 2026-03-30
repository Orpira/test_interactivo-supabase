import { motion } from "framer-motion";

export default function Header() {
  return (
    <header>
      {/* Contenedor principal en fila */}
      <div className="bg-gray-800 text-slate-700 flex items-center justify-between w-full">
        {/* Bloque de texto (título + párrafo) */}
        <div className="flex flex-col w-full">
          <h1 className="w-full sm:text-6xl  leading-tight text-white drop-shadow-lg pl-14">
            WebWiz Quiz
          </h1>

          <p className="w-full mt-1 text-xs sm:text-xl leading-tight text-slate-400 drop-shadow-lg pl-14">
            Domina la magia del código, un quiz a la vez.
          </p>
        </div>

        {/* Ejemplo de bloque a la derecha (logo, botón, etc.) */}
        <motion.img
          src="/logo.png"
          alt="Logo"
          className="hidden sm:block w-40 md:w-52 lg:w-64 h-30 object-contain"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          whileHover={{ scale: 1.08 }}
        />
      </div>
    </header>
  );
}
