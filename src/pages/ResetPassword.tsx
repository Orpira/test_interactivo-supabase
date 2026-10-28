import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/services/auth";
import { translateAuthError } from "@/services/authErrors";

const MIN_PASSWORD_LENGTH = 6;

/**
 * /restablecer: se llega aquí al abrir el enlace del email de recuperación.
 * Supabase ya ha creado una sesión temporal; solo falta fijar la contraseña.
 */
export default function ResetPassword() {
	const { user, isLoading, passwordRecovery, clearPasswordRecovery } =
		useAuth();
	const navigate = useNavigate();
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [show, setShow] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [done, setDone] = useState(false);

	if (isLoading) return <p className="p-6 text-center">Cargando...</p>;

	if (done) {
		return (
			<Card>
				<p className="text-5xl">✅</p>
				<h1 className="text-2xl font-bold">Contraseña actualizada</h1>
				<p className="text-slate-600">
					Ya puedes usar tu nueva contraseña para iniciar sesión.
				</p>
				<button
					type="button"
					onClick={() => navigate("/", { replace: true })}
					className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500"
				>
					Ir al inicio
				</button>
			</Card>
		);
	}

	// Sin sesión: el enlace caducó, ya se usó o se abrió en otro navegador.
	if (!user) {
		return (
			<Card>
				<p className="text-5xl">⌛</p>
				<h1 className="text-2xl font-bold">Enlace no válido</h1>
				<p className="text-slate-600">
					El enlace ha caducado, ya se usó o se abrió en un navegador distinto
					al que lo solicitó. Pide uno nuevo desde «Iniciar sesión → ¿Olvidaste
					tu contraseña?».
				</p>
				<Link to="/" className="text-indigo-600 underline">
					Volver al inicio
				</Link>
			</Card>
		);
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
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
		setSaving(true);
		const { error } = await supabase.auth.updateUser({ password });
		setSaving(false);
		if (error) {
			setError(translateAuthError(error));
			return;
		}
		clearPasswordRecovery();
		setDone(true);
	};

	return (
		<Card>
			<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
				<KeyRound className="h-6 w-6 text-indigo-600" aria-hidden="true" />
			</div>
			<h1 className="text-2xl font-bold">
				{passwordRecovery ? "Crea tu nueva contraseña" : "Cambiar contraseña"}
			</h1>
			<p className="text-sm text-slate-600">
				Cuenta: <strong>{user.email}</strong>
			</p>
			<form onSubmit={handleSubmit} className="space-y-4 text-left">
				<label className="block">
					<span className="mb-1.5 block text-sm font-medium text-slate-700">
						Nueva contraseña
					</span>
					<div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
						<input
							type={show ? "text" : "password"}
							autoComplete="new-password"
							className="min-h-11 w-full bg-transparent text-sm outline-none"
							placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							autoFocus
						/>
						<button
							type="button"
							onClick={() => setShow((v) => !v)}
							className="p-1 text-slate-400 hover:text-slate-600"
							aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
						>
							{show ? (
								<EyeOff className="h-4 w-4" aria-hidden="true" />
							) : (
								<Eye className="h-4 w-4" aria-hidden="true" />
							)}
						</button>
					</div>
				</label>
				<label className="block">
					<span className="mb-1.5 block text-sm font-medium text-slate-700">
						Repite la contraseña
					</span>
					<input
						type={show ? "text" : "password"}
						autoComplete="new-password"
						className="min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
						value={confirm}
						onChange={(e) => setConfirm(e.target.value)}
						required
					/>
				</label>
				<div aria-live="polite">
					{error && (
						<p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
							{error}
						</p>
					)}
				</div>
				<button
					type="submit"
					disabled={saving}
					className="min-h-11 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
				>
					{saving ? "Guardando..." : "Guardar contraseña"}
				</button>
			</form>
		</Card>
	);
}

function Card({ children }: { children: React.ReactNode }) {
	return (
		<section className="mx-auto my-10 w-full max-w-md space-y-4 rounded-2xl border bg-white px-6 py-8 text-center shadow-xl">
			{children}
		</section>
	);
}
