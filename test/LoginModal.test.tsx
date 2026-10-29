import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginModal from "../src/components/ui/LoginModal";

const auth = vi.hoisted(() => ({
	signInWithPassword: vi.fn(),
	signUp: vi.fn(),
	resetPasswordForEmail: vi.fn(),
}));

vi.mock("../src/services/supabase", () => ({ supabase: { auth } }));
vi.mock("../src/services/auth", () => ({
	useAuth: () => ({ loginWithGoogle: vi.fn(), loginWithRedirect: vi.fn() }),
}));

const setup = () => {
	const onClose = vi.fn();
	const user = userEvent.setup();
	render(<LoginModal onClose={onClose} />);
	return { user, onClose };
};

describe("<LoginModal />", () => {
	beforeEach(() => vi.clearAllMocks());

	it("inicia sesión y cierra el modal", async () => {
		auth.signInWithPassword.mockResolvedValue({ error: null });
		const { user, onClose } = setup();
		await user.type(
			screen.getByLabelText("Correo electrónico"),
			" ana@test.com "
		);
		await user.type(screen.getByPlaceholderText("Tu contraseña"), "secreta1");
		await user.click(screen.getByRole("button", { name: "Ingresar" }));
		expect(auth.signInWithPassword).toHaveBeenCalledWith({
			email: "ana@test.com",
			password: "secreta1",
			options: { captchaToken: undefined },
		});
		expect(onClose).toHaveBeenCalled();
	});

	it("traduce credenciales incorrectas", async () => {
		auth.signInWithPassword.mockResolvedValue({
			error: {
				code: "invalid_credentials",
				message: "Invalid login credentials",
			},
		});
		const { user, onClose } = setup();
		await user.type(
			screen.getByLabelText("Correo electrónico"),
			"ana@test.com"
		);
		await user.type(screen.getByPlaceholderText("Tu contraseña"), "mala");
		await user.click(screen.getByRole("button", { name: "Ingresar" }));
		expect(
			await screen.findByText("Email o contraseña incorrectos.")
		).toBeInTheDocument();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("valida que las contraseñas coincidan antes de registrar", async () => {
		const { user } = setup();
		await user.click(screen.getByRole("tab", { name: "Crear cuenta" }));
		await user.type(
			screen.getByLabelText("Correo electrónico"),
			"ana@test.com"
		);
		await user.type(screen.getByPlaceholderText(/Mínimo 6/), "secreta1");
		await user.type(
			screen.getByPlaceholderText("Repite la contraseña"),
			"secreta2"
		);
		await user.click(screen.getByRole("button", { name: "Crear cuenta" }));
		expect(
			screen.getByText("Las contraseñas no coinciden.")
		).toBeInTheDocument();
		expect(auth.signUp).not.toHaveBeenCalled();
	});

	it("registra con nombre y pide confirmar el email", async () => {
		auth.signUp.mockResolvedValue({
			data: { user: { identities: [{}] }, session: null },
			error: null,
		});
		const { user } = setup();
		await user.click(screen.getByRole("tab", { name: "Crear cuenta" }));
		await user.type(screen.getByPlaceholderText(/ranking/), "Ana");
		await user.type(
			screen.getByLabelText("Correo electrónico"),
			"ana@test.com"
		);
		await user.type(screen.getByPlaceholderText(/Mínimo 6/), "secreta1");
		await user.type(
			screen.getByPlaceholderText("Repite la contraseña"),
			"secreta1"
		);
		await user.click(screen.getByRole("button", { name: "Crear cuenta" }));
		expect(auth.signUp).toHaveBeenCalledWith(
			expect.objectContaining({
				email: "ana@test.com",
				password: "secreta1",
				options: expect.objectContaining({ data: { full_name: "Ana" } }),
			})
		);
		expect(
			await screen.findByText(/Te hemos enviado un correo/)
		).toBeInTheDocument();
	});

	it("avisa si el email ya estaba registrado", async () => {
		auth.signUp.mockResolvedValue({
			data: { user: { identities: [] }, session: null },
			error: null,
		});
		const { user } = setup();
		await user.click(screen.getByRole("tab", { name: "Crear cuenta" }));
		await user.type(
			screen.getByLabelText("Correo electrónico"),
			"ana@test.com"
		);
		await user.type(screen.getByPlaceholderText(/Mínimo 6/), "secreta1");
		await user.type(
			screen.getByPlaceholderText("Repite la contraseña"),
			"secreta1"
		);
		await user.click(screen.getByRole("button", { name: "Crear cuenta" }));
		expect(await screen.findByText(/ya tiene una cuenta/)).toBeInTheDocument();
	});

	it("envía el enlace de recuperación", async () => {
		auth.resetPasswordForEmail.mockResolvedValue({ error: null });
		const { user } = setup();
		await user.click(
			screen.getByRole("button", { name: "¿Olvidaste tu contraseña?" })
		);
		await user.type(
			screen.getByLabelText("Correo electrónico"),
			"ana@test.com"
		);
		await user.click(screen.getByRole("button", { name: "Enviar enlace" }));
		expect(auth.resetPasswordForEmail).toHaveBeenCalledWith(
			"ana@test.com",
			expect.objectContaining({
				redirectTo: expect.stringContaining("/auth/callback"),
			})
		);
		expect(await screen.findByText(/recibirás un correo/)).toBeInTheDocument();
		await user.click(
			screen.getByRole("button", { name: /Volver a iniciar sesión/ })
		);
		expect(
			screen.getByRole("button", { name: "Ingresar" })
		).toBeInTheDocument();
	});

	it("se cierra con Escape", async () => {
		const { user, onClose } = setup();
		await user.keyboard("{Escape}");
		expect(onClose).toHaveBeenCalled();
	});
});
