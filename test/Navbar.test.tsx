import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import Navbar from "../src/components/ui/Navbar";

// Mock del módulo de auth para tests
const mockAuth = {
	user: null as null | Record<string, unknown>,
	session: null,
	isAuthenticated: false,
	isLoading: false,
	loginWithRedirect: vi.fn(),
	loginWithGoogle: vi.fn(),
	logout: vi.fn(),
};

vi.mock("../src/services/auth", () => ({
	useAuth: () => mockAuth,
	AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("<Navbar />", () => {
	beforeEach(() => {
		mockAuth.isAuthenticated = false;
		mockAuth.user = null;
		mockAuth.loginWithRedirect = vi.fn();
	});

	it('muestra el boton "Iniciar sesion" cuando NO hay usuario', () => {
		render(
			<MemoryRouter>
				<Navbar />
			</MemoryRouter>
		);
		expect(screen.getByText(/Iniciar\s+sesi/i)).toBeInTheDocument();
	});

	it("no muestra el boton de login si el usuario esta autenticado", () => {
		mockAuth.isAuthenticated = true;
		mockAuth.user = {
			id: "1",
			email: "ada@test.com",
			user_metadata: { full_name: "Ada" },
		};
		render(
			<MemoryRouter>
				<Navbar />
			</MemoryRouter>
		);
		expect(screen.queryByText(/Iniciar\s+sesi/i)).not.toBeInTheDocument();
	});

	it("abre y cierra el panel movil con el boton hamburguesa", async () => {
		const user = userEvent.setup();
		render(
			<MemoryRouter>
				<Navbar />
			</MemoryRouter>
		);

		const openBtn = screen.getByRole("button", { name: /abrir menú/i });
		await user.click(openBtn);

		expect(
			await screen.findByRole("navigation", {
				name: /Menú móvil/i,
				hidden: true,
			})
		).toBeInTheDocument();
		expect(openBtn).toHaveAttribute("aria-expanded", "true");

		await user.click(screen.getByRole("button", { name: /cerrar menú/i }));

		expect(
			screen.queryByRole("navigation", { name: /Menú móvil/i, hidden: true })
		).not.toBeInTheDocument();
	});
});
