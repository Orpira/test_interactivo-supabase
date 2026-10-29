import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Result from "../src/features/quiz/Result";

// Usuario anónimo: el resultado no se guarda ni se pide feedback.
vi.mock("../src/services/auth", () => ({
	useAuth: () => ({ user: null, isAuthenticated: false, isLoading: false }),
}));

const summary = [
	{
		question: "¿Qué etiqueta crea un enlace?",
		options: ["<a>", "<link>", "<p>"],
		correctAnswer: "<a>",
		selectedAnswer: "<a>",
		shortExplanation: "La etiqueta <a> define hipervínculos.",
		sourceUrl: "https://developer.mozilla.org/es/docs/Web/HTML/Element/a",
		sourceName: "MDN",
	},
	{
		question: "¿Qué propiedad cambia el color del texto?",
		options: ["color", "font", "background"],
		correctAnswer: "color",
		selectedAnswer: "background",
		shortExplanation: "",
	},
];

function renderResult(state?: object) {
	return render(
		<MemoryRouter
			initialEntries={[state ? { pathname: "/result", state } : "/result"]}
		>
			<Result />
		</MemoryRouter>
	);
}

describe("<Result />", () => {
	it("muestra la puntuación, el porcentaje y la categoría", () => {
		renderResult({ score: 1, total: 2, category: "html", summary });

		expect(screen.getByText("QUIZ COMPLETADO · HTML")).toBeInTheDocument();
		expect(screen.getByText(/1 \/ 2 \(50%\) · html/)).toBeInTheDocument();
	});

	it("diagnóstico: titular, calibración y una única acción recomendada", async () => {
		const user = userEvent.setup();
		const withConfidence = [
			{ ...summary[0], confidence: "seguro", concepts: [{ id: "enlaces", name: "Enlaces", area: "HTML" }] },
			{ ...summary[1], confidence: "seguro", concepts: [{ id: "color", name: "Color", area: "CSS" }] },
		];
		renderResult({ score: 1, total: 2, category: "frontend", summary: withConfidence });

		expect(screen.getByRole("heading", { level: 1, name: "Dominas Enlaces. Color todavía te engaña." })).toBeInTheDocument();
		expect(screen.getByRole("img", { name: "Seguro: 50% de aciertos" })).toBeInTheDocument();
		expect(screen.getByText(/fallaste 1 de las 2 que marcaste como «Seguro»/)).toBeInTheDocument();
		expect(screen.getByText("Siguiente paso recomendado")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Empezar" })).toHaveAttribute("href", "/repaso?conceptos=color&count=5");

		const toggle = screen.getByRole("button", { name: /Revisar las 1 falladas/ });
		expect(toggle).toHaveAttribute("aria-expanded", "false");
		await user.click(toggle);
		expect(toggle).toHaveAttribute("aria-expanded", "true");
	});

	it("muestra un aviso si no hay respuestas", () => {
		renderResult();
		expect(
			screen.getByText(/No hay respuestas disponibles/i)
		).toBeInTheDocument();
	});

	it("despliega la explicación y solo enlaza a la fuente si existe", async () => {
		const user = userEvent.setup();
		renderResult({ score: 1, total: 2, category: "html", summary });

		await user.click(screen.getByText("Ver todas las respuestas"));
		await user.click(screen.getByText(summary[0].question));
		const link = screen.getByRole("link", {
			name: /explicación ampliada en MDN/i,
		});
		expect(link).toHaveAttribute("href", summary[0].sourceUrl);

		await user.click(screen.getByText(summary[1].question));
		expect(
			screen.getAllByRole("link", { name: /explicación ampliada/i })
		).toHaveLength(1);
		// El comentario JSX que antes se colaba en la interfaz no debe aparecer
		expect(screen.queryByText(/Mostrar texto por/i)).not.toBeInTheDocument();
	});
});
