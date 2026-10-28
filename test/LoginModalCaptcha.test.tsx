import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
	signInWithPassword: vi.fn(),
	signUp: vi.fn(),
	resetPasswordForEmail: vi.fn(),
}));
const resetCaptcha = vi.hoisted(() => vi.fn());

vi.mock("../src/services/supabase", () => ({ supabase: { auth } }));
vi.mock("../src/services/auth", () => ({
	useAuth: () => ({ loginWithGoogle: vi.fn(), loginWithRedirect: vi.fn() }),
}));
// Sustituto del widget: un botón que simula resolver el captcha
vi.mock("@hcaptcha/react-hcaptcha", async () => {
	const React = await import("react");
	return {
		default: React.forwardRef(
			(props: { onVerify: (t: string) => void }, ref) => {
				React.useImperativeHandle(ref, () => ({ resetCaptcha }));
				return (
					<button type="button" onClick={() => props.onVerify("token-123")}>
						Resolver captcha
					</button>
				);
			}
		),
	};
});

async function renderWithCaptcha() {
	vi.stubEnv("VITE_HCAPTCHA_SITE_KEY", "10000000-ffff-ffff-ffff-000000000001");
	vi.resetModules();
	const { default: LoginModal } = await import(
		"../src/components/ui/LoginModal"
	);
	render(<LoginModal onClose={vi.fn()} />);
	return userEvent.setup();
}

describe("<LoginModal /> con hCaptcha", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.unstubAllEnvs();
	});

	it("exige completar el captcha antes de enviar", async () => {
		const user = await renderWithCaptcha();
		await user.type(
			screen.getByLabelText("Correo electrónico"),
			"ana@test.com"
		);
		await user.type(screen.getByPlaceholderText("Tu contraseña"), "secreta1");
		await user.click(screen.getByRole("button", { name: "Ingresar" }));
		expect(screen.getByText(/verificación de seguridad/)).toBeInTheDocument();
		expect(auth.signInWithPassword).not.toHaveBeenCalled();
	});

	it("envía el token y lo renueva tras el intento", async () => {
		auth.signInWithPassword.mockResolvedValue({
			error: { code: "captcha_failed", message: "captcha protection: ..." },
		});
		const user = await renderWithCaptcha();
		await user.type(
			screen.getByLabelText("Correo electrónico"),
			"ana@test.com"
		);
		await user.type(screen.getByPlaceholderText("Tu contraseña"), "secreta1");
		await user.click(screen.getByRole("button", { name: "Resolver captcha" }));
		await user.click(screen.getByRole("button", { name: "Ingresar" }));
		expect(auth.signInWithPassword).toHaveBeenCalledWith(
			expect.objectContaining({ options: { captchaToken: "token-123" } })
		);
		expect(
			await screen.findByText(/verificación de seguridad ha fallado/)
		).toBeInTheDocument();
		expect(resetCaptcha).toHaveBeenCalled();
	});

	it("envía el token también en la recuperación de contraseña", async () => {
		auth.resetPasswordForEmail.mockResolvedValue({ error: null });
		const user = await renderWithCaptcha();
		await user.click(
			screen.getByRole("button", { name: "¿Olvidaste tu contraseña?" })
		);
		await user.type(
			screen.getByLabelText("Correo electrónico"),
			"ana@test.com"
		);
		await user.click(screen.getByRole("button", { name: "Resolver captcha" }));
		await user.click(screen.getByRole("button", { name: "Enviar enlace" }));
		expect(auth.resetPasswordForEmail).toHaveBeenCalledWith(
			"ana@test.com",
			expect.objectContaining({ captchaToken: "token-123" })
		);
	});
});
