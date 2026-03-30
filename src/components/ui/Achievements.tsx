// src/components/Achievements.tsx
import React from "react";

type Achievement = {
  icon: string;
  title: string;
  unlocked: boolean;
};

export default function Achievements({
  achievements,
}: {
  achievements: Achievement[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
      {achievements.map((a, i) => (
        <div
          key={i}
          className={`p-4 rounded-xl border text-center shadow-md ${
            a.unlocked
              ? "bg-green-100 border-green-400"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          <div className="text-3xl">{a.icon}</div>
          <div className="text-lg font-semibold">{a.title}</div>
          <div className="text-sm">
            {a.unlocked ? "¡Desbloqueado!" : "No alcanzado aún"}
          </div>
        </div>
      ))}
    </div>
  );
}
