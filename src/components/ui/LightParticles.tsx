import React, { useEffect, useState } from "react";

interface ParticleProps {
  position: "top" | "bottom";
  direction: "left" | "right";
}

const Particle = ({ direction }: ParticleProps) => {
  return (
    <span
      className="particle absolute w-3 h-3 bg-white rounded-full shadow-md"
      style={{
        //top: position === "top" ? "30%" : "70%",
        left: direction === "left" ? "0" : undefined,
        right: direction === "right" ? "0" : undefined,
        animation: `${
          direction === "right" ? "move-left" : "move-right"
        } 3s linear infinite, fade 3s linear infinite`,
      }}
    ></span>
  );
};

export default function LightParticles() {
  return (
    <div className="overflow-hidden">
      <Particle position="top" direction="right" />
      <Particle position="bottom" direction="left" />
    </div>
  );
}
