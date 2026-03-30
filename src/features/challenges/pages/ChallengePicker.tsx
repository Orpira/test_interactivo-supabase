import { motion, AnimatePresence } from "framer-motion";
import { useHandleGo } from "@/utils/navigateUtils";
import React from "react";

type PickerProps = {
  open: boolean;
  onClose: () => void;
};

const categories = ["HTML", "CSS", "JavaScript"] as const;

export default function ChallengePicker({ open, onClose }: PickerProps) {
  const handleGo = useHandleGo;

  return (
    <AnimatePresence>
      {open && (
        /* -------- Overlay -------- */
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* -------- Modal -------- */}
          <motion.div
            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-lg p-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 text-center">Elegir reto</h2>

            {/* selector simple */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const cat = (
                  form.elements.namedItem("cat") as HTMLSelectElement
                ).value;
                const id = (
                  form.elements.namedItem("id") as HTMLInputElement
                ).value.trim();
                if (!cat || !id) return;
                useHandleGo();
              }}
              className="space-y-4"
            >
              <select
                required
                name="cat"
                className="w-full border rounded p-2"
                defaultValue=""
              >
                <option value="" disabled>
                  -- Categoría --
                </option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <input
                required
                name="id"
                type="text"
                placeholder="ID del reto (html-01)"
                className="w-full border rounded p-2"
              />

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-500"
              >
                Ir al editor
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
