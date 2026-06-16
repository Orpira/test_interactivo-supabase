import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Result from "../src/features/quiz/Result";
import "@testing-library/jest-dom";

describe("Result page", () => {
  it("muestra el resultado correctamente", () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/result",
            state: {
              score: 7,
              total: 10,
              category: "HTML",
            },
          } as any,
        ]}
      >
        <Result />
      </MemoryRouter>
    );

    expect(screen.getByText(/Resultado del quiz/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Has obtenido 7 de 10 puntos/i)
    ).toBeInTheDocument();
  });

  it("muestra mensaje si no hay datos", () => {
    render(
      <MemoryRouter initialEntries={["/result"]}>
        <Result />
      </MemoryRouter>
    );

    expect(screen.getByText(/No hay datos del resultado/i)).toBeInTheDocument();
  });

  it("muestra la categoría correctamente", () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/result",
            state: {
              score: 5,
              total: 10,
              category: "css",
            },
          } as any,
        ]}
      >
        <Result />
      </MemoryRouter>
    );

    // Buscar el elemento exacto que contiene la categoría
    const categoriaNode = screen
      .getAllByText(
        (content, node) => {
          return (node?.textContent || "")
            .toLowerCase()
            .includes("categoría: css");
        },
        { exact: false }
      )
      .find((el) => el.textContent?.toLowerCase().includes("categoría: css"));
    expect(categoriaNode).toBeInTheDocument();
  });
});
