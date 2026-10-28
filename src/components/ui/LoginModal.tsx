import { useEffect, useId, useRef, useState } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import {
	ArrowLeft,
	Eye,
	EyeOff,
	Github,
	Lock,
	Mail,
	User,
	UserCircle,
	X,
} from "lucide-react";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/services/auth";
import { getAuthRedirectUrl } from "@/services/authRedirect";
import { translateAuthError } from "@/services/authErrors";

export type LoginMode = "login" | "signup" | "forgot";

const MIN_PASSWORD_LENGTH = 6;

// Si el proyecto de Supabase tiene activada la protección CAPTCHA, todas las
// peticiones con email (login, registro y recuperación) necesitan un token.
const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY;

type Props = {
	onClose: () => void;
	initialMode?: LoginMode;
};

const TITLES: Record<LoginMode, { title: string; subtitle: string }> = {
	login: {
		title: "Accede a WebWiz Quiz",
		subtitle:
			"Guarda tu progreso, consulta tu historial y continúa tus retos desde cualquier dispositivo.",
	},
	signup: {
		title: "Crea tu cuenta",
		subtitle:
			"Regístrate gratis para guardar resultados, aparecer en el ranking y resolver retos.",
	},
	forgot: {
		title: "Recupera tu contraseña",
		subtitle:
			"Te enviaremos un enlace para elegir una contraseña nueva. Ábrelo en este mismo navegador o dispositivo.",
	},
};

export default function LoginModal({ onClose, initialMode = "login" }: Props) {
	const { loginWithGoogle, loginWithRedirect } = useAuth();
	const [mode, setMode] = useState<LoginMode>(initialMode);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const [captchaToken, setCaptchaToken] = useState<string | null>(null);
	const captchaRef = useRef<HCaptcha>(null);

	// Los tokens de hCaptcha son de un solo uso: se renuevan tras cada intento.
	const resetCaptcha = () => {
		setCaptchaToken(null);
		captchaRef.current?.resetCaptcha();
	};

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	const switchMode = (next: LoginMode) => {
		setMode(next);
		resetCaptcha();
		setError("");
		setNotice("");
		setPassword("");
		setConfirm("");
	};

	const run = async (action: () => Promise<void>) => {
		setLoading(true);
		setError("");
		setNotice("");
		try {
			await action();
		} catch (err) {
			setError(translateAuthError(err));
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const cleanEmail = email.trim();
		const captcha = captchaToken ?? undefined;

		if (HCAPTCHA_SITE_KEY && !captchaToken) {
			setError("Completa la verificación de seguridad antes de continuar.");
			return;
		}

		// Envuelve run() para renovar el captcha cuando termine el intento
		const submit = (action: () => Promise<void>) =>
			run(action).finally(resetCaptcha);

		if (mode === "login") {
			return submit(async () => {
				const { error } = await supabase.auth.signInWithPassword({
					email: cleanEmail,
					password,
					options: { captchaToken: captcha },
				});
				if (error) throw error;
				onClose();
			});
		}

		if (mode === "signup") {
			if (password.length < MIN_PASSWORD_LENGTH) {
				setError(
					`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
				);
				return;
			}
			if (password !== confirm) {
				setError("Las contraseñas no coinciden.");
				return;
			}
			return submit(async () => {
				const { data, error } = await supabase.auth.signUp({
					email: cleanEmail,
					password,
					options: {
						emailRedirectTo: getAuthRedirectUrl(),
						captchaToken: captcha,
						data: name.trim() ? { full_name: name.trim() } : undefined,
					},
				});
				if (error) throw error;

				// Con la protección anti-enumeración, un email ya registrado
				// devuelve un usuario sin identidades en lugar de un error.
				if (data.user && data.user.identities?.length === 0) {
					setError(
						"Ese correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña."
					);
					return;
				}
				if (data.session) {
					onClose(); // confirmación de email desactivada: sesión directa
					return;
				}
				setPassword("");
				setConfirm("");
				setNotice(
					`¡Cuenta creada! Te hemos enviado un correo a ${cleanEmail} para confirmarla. Después podrás iniciar sesión.`
				);
			});
		}

		return submit(async () => {
			const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
				redirectTo: getAuthRedirectUrl(),
				captchaToken: captcha,
			});
			if (error) throw error;
			setNotice(
				`Si existe una cuenta con ${cleanEmail}, recibirás un correo con un enlace para crear una contraseña nueva.`
			);
		});
	};

	const { title, subtitle } = TITLES[mode];
	const submitLabel = {
		login: loading ? "Ingresando..." : "Ingresar",
		signup: loading ? "Creando cuenta..." : "Crear cuenta",
		forgot: loading ? "Enviando..." : "Enviar enlace",
	}[mode];

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/75 px-4 py-6 backdrop-blur-sm"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="login-modal-title"
				className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl"
			>
				<div className="bg-slate-950 px-6 py-6 text-white">
					<div className="flex items-start justify-between gap-4">
						<div>
							<div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 ring-1 ring-indigo-300/30">
								<img src="/logo.png" alt="" className="h-9 w-9" />
							</div>
							<h2 id="login-modal-title" className="text-2xl font-bold">
								{title}
							</h2>
							<p className="mt-2 text-sm leading-6 text-slate-300">
								{subtitle}
							</p>
						</div>
						<button
							type="button"
							className="rounded-full p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
							onClick={onClose}
							aria-label="Cerrar"
						>
							<X className="h-5 w-5" aria-hidden="true" />
						</button>
					</div>

					{mode !== "forgot" && (
						<div
							className="mt-5 grid grid-cols-2 rounded-lg bg-white/10 p-1 text-sm font-semibold"
							role="tablist"
						>
							{(["login", "signup"] as const).map((m) => (
								<button
									key={m}
									type="button"
									role="tab"
									aria-selected={mode === m}
									onClick={() => switchMode(m)}
									className={`rounded-md px-3 py-2 transition ${
										mode === m
											? "bg-white text-slate-900 shadow"
											: "text-slate-300 hover:text-white"
									}`}
								>
									{m === "login" ? "Entrar" : "Crear cuenta"}
								</button>
							))}
						</div>
					)}
				</div>

				<div className="space-y-5 px-6 py-6">
					{mode !== "forgot" && (
						<>
							<div className="grid gap-3 sm:grid-cols-2">
								<button
									type="button"
									onClick={() => run(loginWithGoogle)}
									className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-indigo-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
									disabled={loading}
								>
									<GoogleIcon />
									Google
								</button>
								<button
									type="button"
									onClick={() => run(loginWithRedirect)}
									className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
									disabled={loading}
								>
									<Github className="h-5 w-5" aria-hidden="true" />
									GitHub
								</button>
							</div>

							<div className="flex items-center gap-3">
								<div className="h-px flex-1 bg-slate-200" />
								<span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
									o con email
								</span>
								<div className="h-px flex-1 bg-slate-200" />
							</div>
						</>
					)}

					<form onSubmit={handleSubmit} className="space-y-4">
						{mode === "signup" && (
							<Field label="Nombre (opcional)" icon={User}>
								{(id) => (
									<input
										id={id}
										type="text"
										autoComplete="name"
										className={INPUT}
										placeholder="Cómo quieres aparecer en el ranking"
										value={name}
										onChange={(e) => setName(e.target.value)}
										maxLength={60}
									/>
								)}
							</Field>
						)}

						<Field label="Correo electrónico" icon={Mail}>
							{(id) => (
								<input
									id={id}
									type="email"
									autoComplete="email"
									className={INPUT}
									placeholder="tu@email.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									autoFocus
								/>
							)}
						</Field>

						{mode !== "forgot" && (
							<Field
								label="Contraseña"
								icon={Lock}
								action={
									mode === "login" ? (
										<button
											type="button"
											onClick={() => switchMode("forgot")}
											className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
										>
											¿Olvidaste tu contraseña?
										</button>
									) : null
								}
							>
								{(id) => (
									<>
										<input
											id={id}
											type={showPassword ? "text" : "password"}
											autoComplete={
												mode === "login" ? "current-password" : "new-password"
											}
											className={INPUT}
											placeholder={
												mode === "login"
													? "Tu contraseña"
													: `Mínimo ${MIN_PASSWORD_LENGTH} caracteres`
											}
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											minLength={
												mode === "signup" ? MIN_PASSWORD_LENGTH : undefined
											}
											required
										/>
										<button
											type="button"
											onClick={() => setShowPassword((v) => !v)}
											className="p-1 text-slate-400 hover:text-slate-600"
											aria-label={
												showPassword
													? "Ocultar contraseña"
													: "Mostrar contraseña"
											}
										>
											{showPassword ? (
												<EyeOff className="h-4 w-4" aria-hidden="true" />
											) : (
												<Eye className="h-4 w-4" aria-hidden="true" />
											)}
										</button>
									</>
								)}
							</Field>
						)}

						{mode === "signup" && (
							<Field label="Repite la contraseña" icon={Lock}>
								{(id) => (
									<input
										id={id}
										type={showPassword ? "text" : "password"}
										autoComplete="new-password"
										className={INPUT}
										placeholder="Repite la contraseña"
										value={confirm}
										onChange={(e) => setConfirm(e.target.value)}
										required
									/>
								)}
							</Field>
						)}

						{HCAPTCHA_SITE_KEY && (
							<div className="flex justify-center">
								<HCaptcha
									ref={captchaRef}
									sitekey={HCAPTCHA_SITE_KEY}
									languageOverride="es"
									onVerify={(token) => {
										setCaptchaToken(token);
										setError("");
									}}
									onExpire={() => setCaptchaToken(null)}
									onError={() => {
										setCaptchaToken(null);
										setError(
											"No se pudo cargar la verificación de seguridad. Recarga la página."
										);
									}}
								/>
							</div>
						)}

						<div aria-live="polite">
							{error && (
								<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
									{error}
								</div>
							)}
							{notice && (
								<div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
									{notice}
								</div>
							)}
						</div>

						<button
							type="submit"
							className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
							disabled={loading}
						>
							<UserCircle className="h-5 w-5" aria-hidden="true" />
							{submitLabel}
						</button>

						{mode === "forgot" && (
							<button
								type="button"
								onClick={() => switchMode("login")}
								className="flex w-full items-center justify-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900"
							>
								<ArrowLeft className="h-4 w-4" aria-hidden="true" />
								Volver a iniciar sesión
							</button>
						)}
					</form>
				</div>
			</div>
		</div>
	);
}

const INPUT =
	"min-h-11 w-full bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400";

function Field({
	label,
	icon: Icon,
	action,
	children,
}: {
	label: string;
	icon: typeof Mail;
	action?: React.ReactNode;
	/** Recibe el id que debe llevar el input para quedar asociado a la etiqueta */
	children: (id: string) => React.ReactNode;
}) {
	const id = useId();
	return (
		<div>
			<div className="mb-1.5 flex items-center justify-between">
				<label htmlFor={id} className="text-sm font-medium text-slate-700">
					{label}
				</label>
				{action}
			</div>
			<div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 transition focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
				<Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
				{children(id)}
			</div>
		</div>
	);
}

function GoogleIcon() {
	return (
		<svg className="h-5 w-5 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
			<path
				fill="#4285F4"
				d="M44.5 20H24v8.5h11.7C34.7 33.1 29.9 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6.4-6.4C33.5 5.1 28.1 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-8.1 20-21 0-1.3-.1-2.1-.3-3z"
			/>
			<path
				fill="#34A853"
				d="M6.3 14.7l7 5.1C15.1 17.1 19.2 14 24 14c2.7 0 5.2.9 7.2 2.4l6.4-6.4C33.5 5.1 28.1 3 24 3c-7.2 0-13.4 3.1-17.7 8.1z"
			/>
			<path
				fill="#FBBC05"
				d="M24 44c5.9 0 10.7-1.9 14.3-5.1l-6.6-5.4C29.7 35.1 27 36 24 36c-5.8 0-10.7-3.9-12.5-9.3l-7 5.4C7.9 41.1 15.4 44 24 44z"
			/>
			<path
				fill="#EA4335"
				d="M44.5 20H24v8.5h11.7c-1.6 4.1-6.1 7.5-11.7 7.5-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6.4-6.4C33.5 5.1 28.1 3 24 3c-7.2 0-13.4 3.1-17.7 8.1z"
			/>
		</svg>
	);
}
