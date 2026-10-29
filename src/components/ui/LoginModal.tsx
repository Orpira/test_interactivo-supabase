import { useEffect, useId, useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import {
	ArrowLeft,
	Check,
	Code2,
	Flame,
	Trophy,
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
import { getStoredTheme } from "@/services/theme";
import { motion, useReducedMotion } from "framer-motion";

export type LoginMode = "login" | "signup" | "forgot";

const MIN_PASSWORD_LENGTH = 6;

// Si el proyecto de Supabase tiene activada la protección CAPTCHA (Cloudflare
// Turnstile), las peticiones con email (login, registro y recuperación)
// necesitan un token. Sin site key configurada el widget no se muestra.
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

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
	const reduceMotion = useReducedMotion();
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
	const captchaRef = useRef<TurnstileInstance>(undefined);

	// Los tokens de Turnstile son de un solo uso: se renuevan tras cada intento.
	const resetCaptcha = () => {
		setCaptchaToken(null);
		captchaRef.current?.reset();
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

		if (TURNSTILE_SITE_KEY && !captchaToken) {
			setError(
				"Espera a que termine la verificación de seguridad y vuelve a intentarlo."
			);
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
			className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-bg/80 px-4 py-6 backdrop-blur-md"
			onMouseDown={(e) => e.target === e.currentTarget && onClose()}
		>
			<motion.div
				role="dialog"
				aria-modal="true"
				aria-labelledby="login-modal-title"
				initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ duration: 0.25, ease: "easeOut" }}
				className="relative grid w-full max-w-4xl overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_30px_80px_-20px_rgb(0_0_0/0.6)] md:grid-cols-[1fr_1.1fr]"
			>
				<BrandPanel mode={mode} reduceMotion={!!reduceMotion} />

				<div className="relative">
					<button
						type="button"
						className="absolute right-3 top-3 z-10 flex min-h-touch min-w-touch items-center justify-center rounded-full text-muted transition hover:bg-surface2 hover:text-fg"
						onClick={onClose}
						aria-label="Cerrar"
					>
						<X className="h-5 w-5" aria-hidden="true" />
					</button>

					<div className="px-6 pb-2 pt-7 sm:px-8">
						<div className="mb-4 flex items-center gap-2 md:hidden">
							<img src="/logo.png" alt="" className="h-8 w-8" />
							<span className="font-display text-lg font-bold">WebWiz</span>
						</div>
						<h2
							id="login-modal-title"
							className="pr-10 text-2xl font-bold sm:text-[1.75rem]"
						>
							{title}
						</h2>
						<p className="mt-1.5 text-sm leading-6 text-muted">{subtitle}</p>

						{mode !== "forgot" && (
							<div
								className="relative mt-5 grid grid-cols-2 rounded-xl border border-line bg-surface2 p-1 text-sm font-semibold"
								role="tablist"
							>
								{(["login", "signup"] as const).map((m) => (
									<button
										key={m}
										type="button"
										role="tab"
										aria-selected={mode === m}
										onClick={() => switchMode(m)}
										className={`relative min-h-10 rounded-lg px-3 py-2 transition-colors ${
											mode === m ? "text-fg" : "text-muted hover:text-fg"
										}`}
									>
										{mode === m && (
											<motion.span
												layoutId="login-tab"
												className="absolute inset-0 rounded-lg border border-line bg-surface shadow-sm"
												transition={{
													type: "spring",
													stiffness: 500,
													damping: 38,
												}}
											/>
										)}
										<span className="relative">
											{m === "login" ? "Entrar" : "Crear cuenta"}
										</span>
									</button>
								))}
							</div>
						)}
					</div>

					<div className="space-y-5 px-6 pb-7 pt-4 sm:px-8">
						{mode !== "forgot" && (
							<>
								<div className="grid gap-3 sm:grid-cols-2">
									<button
										type="button"
										onClick={() => run(loginWithGoogle)}
										className="flex min-h-touch items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-fg transition hover:-translate-y-px hover:border-accent/60 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
										disabled={loading}
									>
										<GoogleIcon />
										Google
									</button>
									<button
										type="button"
										onClick={() => run(loginWithRedirect)}
										className="flex min-h-touch items-center justify-center gap-2 rounded-xl bg-fg px-4 py-2.5 text-sm font-semibold text-bg transition hover:-translate-y-px hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
										disabled={loading}
									>
										<Github className="h-5 w-5" aria-hidden="true" />
										GitHub
									</button>
								</div>

								<div className="flex items-center gap-3">
									<div className="h-px flex-1 bg-line" />
									<span className="font-mono text-[0.7rem] font-semibold uppercase tracking-widest text-muted">
										o con email
									</span>
									<div className="h-px flex-1 bg-line" />
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
												className="text-xs font-semibold text-accent hover:text-accent/80"
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
												className="p-1 text-muted hover:text-fg"
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

							{TURNSTILE_SITE_KEY && (
								<div className="flex justify-center">
									<Turnstile
										ref={captchaRef}
										siteKey={TURNSTILE_SITE_KEY}
										options={{ language: "es", theme: getStoredTheme() }}
										onSuccess={(token) => {
											setCaptchaToken(token);
											setError("");
										}}
										onExpire={() => setCaptchaToken(null)}
										onError={() => {
											setCaptchaToken(null);
											setError(
												"No se pudo completar la verificación de seguridad. Recarga la página."
											);
										}}
									/>
								</div>
							)}

							<div aria-live="polite">
								{error && (
									<div className="rounded-lg border border-warn/40 bg-warn-soft px-3 py-2 text-sm text-warn">
										{error}
									</div>
								)}
								{notice && (
									<div className="rounded-lg border border-accent/40 bg-accent-soft px-3 py-2 text-sm text-accent">
										{notice}
									</div>
								)}
							</div>

							<button
								type="submit"
								className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 font-semibold text-accent-fg shadow-[0_10px_30px_-10px_rgb(var(--accent)/0.7)] transition hover:-translate-y-px hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
								disabled={loading}
							>
								<UserCircle className="h-5 w-5" aria-hidden="true" />
								{submitLabel}
							</button>

							{mode === "forgot" && (
								<button
									type="button"
									onClick={() => switchMode("login")}
									className="flex w-full items-center justify-center gap-1 text-sm font-semibold text-muted hover:text-fg"
								>
									<ArrowLeft className="h-4 w-4" aria-hidden="true" />
									Volver a iniciar sesión
								</button>
							)}
						</form>
					</div>
				</div>
			</motion.div>
		</div>
	);
}

const INPUT =
	"min-h-11 w-full bg-transparent px-3 text-sm text-fg outline-none placeholder:text-muted";

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
				<label htmlFor={id} className="text-sm font-medium text-muted">
					{label}
				</label>
				{action}
			</div>
			<div className="flex items-center rounded-xl border border-line bg-surface2 px-3 transition focus-within:border-accent focus-within:bg-surface focus-within:ring-4 focus-within:ring-accent/15">
				<Icon className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
				{children(id)}
			</div>
		</div>
	);
}

function GoogleIcon() {
	// Logo oficial de Google: sus colores de marca viven en el SVG, no en el componente
	return <img src="/icons/google.svg" alt="" className="h-5 w-5 shrink-0" />;
}

const DEMO_TESTS = [
	".card centrada en horizontal",
	".card centrada en vertical",
	"sin bucles infinitos",
];

/**
 * Panel de marca (solo escritorio): propuesta de valor y una mini consola
 * de tests que se van poniendo en verde.
 */
function BrandPanel({
	mode,
	reduceMotion,
}: {
	mode: LoginMode;
	reduceMotion: boolean;
}) {
	const headline =
		mode === "signup"
			? "Empieza a entrenar como trabajarás."
			: mode === "forgot"
			? "Te ayudamos a volver."
			: "No memorices respuestas. Entrena el trabajo.";

	return (
		<aside
			aria-hidden="true"
			className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-bg p-8 md:flex"
		>
			{/* Fondo: brillo de marca y rejilla sutil */}
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					backgroundImage:
						"radial-gradient(600px circle at 0% 0%, rgb(var(--accent) / 0.22), transparent 55%), radial-gradient(500px circle at 100% 100%, rgb(var(--warn) / 0.16), transparent 55%), linear-gradient(rgb(var(--border) / 0.35) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--border) / 0.35) 1px, transparent 1px)",
					backgroundSize: "auto, auto, 28px 28px, 28px 28px",
				}}
			/>

			<div className="relative">
				<div className="flex items-center gap-2">
					<img src="/logo.png" alt="" className="h-9 w-9" />
					<span className="font-display text-xl font-bold">WebWiz</span>
					<span className="rounded-md border border-accent/40 px-1.5 font-mono text-[0.65rem] uppercase tracking-widest text-accent">
						quiz
					</span>
				</div>
				<p className="mt-8 font-display text-3xl font-bold leading-tight">
					{headline}
				</p>
				<ul className="mt-6 space-y-3 text-sm">
					{[
						{
							icon: Code2,
							text: "Retos corregidos por comportamiento, no por texto",
						},
						{
							icon: Flame,
							text: "Rachas y progreso guardados en todos tus dispositivos",
						},
						{ icon: Trophy, text: "Ranking con la comunidad" },
					].map(({ icon: Icon, text }) => (
						<li key={text} className="flex items-center gap-3 text-muted">
							<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface">
								<Icon className="h-4 w-4 text-accent" />
							</span>
							{text}
						</li>
					))}
				</ul>
			</div>

			<div className="relative mt-10 rounded-xl border border-line bg-surface/80 p-4 font-mono text-xs backdrop-blur">
				<div className="mb-3 flex items-center justify-between text-muted">
					<span>styles.css · tests</span>
					<motion.span
						initial={reduceMotion ? false : { opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: reduceMotion ? 0 : 1.6 }}
						className="font-semibold text-accent"
					>
						3/3
					</motion.span>
				</div>
				<ul className="space-y-2">
					{DEMO_TESTS.map((t, i) => (
						<li key={t} className="flex items-center gap-2">
							<motion.span
								initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								transition={{
									delay: reduceMotion ? 0 : 0.5 + i * 0.4,
									type: "spring",
									stiffness: 400,
									damping: 20,
								}}
								className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-accent-fg"
							>
								<Check className="h-3 w-3" strokeWidth={3} />
							</motion.span>
							<span className="text-fg">{t}</span>
						</li>
					))}
				</ul>
			</div>
		</aside>
	);
}
