/** @type {import('tailwindcss').Config} */
import { fontFamily } from "tailwindcss/defaultTheme";

// Colores del sistema de diseño (ver styles/index.css). Admiten opacidad: bg-accent/20
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
	darkMode: ["class"],
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			borderRadius: {
				sm: "0.5rem",
				md: "0.625rem", // 10px: botones
				lg: "0.75rem", // 12px: botones grandes, bloques de código
				xl: "0.875rem", // 14px: tarjetas
				"2xl": "1rem", // 16px: tarjetas grandes y modales
			},
			fontFamily: {
				sans: ["Inter Variable", "Inter", ...fontFamily.sans],
				display: ["Space Grotesk Variable", "Space Grotesk", ...fontFamily.sans],
				mono: ["JetBrains Mono Variable", "JetBrains Mono", ...fontFamily.mono],
			},
			colors: {
				bg: token("bg"),
				surface: token("surface"),
				surface2: token("surface-2"),
				line: token("border"),
				fg: token("text"),
				muted: token("muted"),
				accent: {
					DEFAULT: token("accent"),
					fg: token("accent-fg"),
					soft: token("accent-soft"),
					softer: token("accent-softer"),
				},
				warn: {
					DEFAULT: token("warn"),
					fg: token("warn-fg"),
					soft: token("warn-soft"),
				},
			},
			minHeight: { touch: "2.75rem" },
			minWidth: { touch: "2.75rem" },
		},
	},
	plugins: [require("tailwindcss-animate")],
};
