import { useAuth } from "../../services/auth";

type UserProfileModalProps = {
	open: boolean;
	setOpen: (open: boolean) => void;
	user: {
		name: string;
		email: string;
		picture?: string;
		[key: string]: unknown;
	};
};

export default function UserProfileModal({
	open,
	setOpen,
	user,
}: UserProfileModalProps) {
	const { logout } = useAuth();

	if (!open) return null;

	return (
		<div className="fixed inset-0 bg-bg bg-opacity-50 z-50 flex items-center justify-center">
			<div className="bg-surface rounded-lg shadow-lg p-6 w-full max-w-md relative">
				{/* Botón X cerrar arriba a la derecha */}
				<button
					onClick={() => setOpen(false)}
					className="absolute top-3 right-3 text-muted hover:text-warn text-2xl font-bold focus:outline-none"
					aria-label="Cerrar"
				>
					×
				</button>
				<h2 className="text-xl font-bold mb-4">Mi perfil</h2>

				<div className="mb-4">
					<label className="block text-fg text-sm font-medium mb-1">
						Nombre
					</label>
					<input
						defaultValue={user.name}
						className="w-full border rounded px-3 py-2 text-fg"
					/>
				</div>

				<div className="mb-4">
					<label className="block text-fg text-sm font-medium mb-1">
						Correo electrónico
					</label>
					<input
						value={user.email}
						disabled
						className="w-full bg-surface2 border text-fg rounded px-3 py-2"
					/>
				</div>

				{user.picture && (
					<div className="flex items-center gap-3 mb-4">
						<img
							src={user.picture}
							alt="Avatar"
							className="w-12 h-12 rounded-full object-cover"
						/>
						<button
							onClick={() =>
								alert("Funcionalidad de cambiar avatar próximamente")
							}
							className="text-sm text-accent underline"
						>
							Cambiar avatar
						</button>
					</div>
				)}

				<div className="flex justify-end">
					<button
						onClick={() => logout()}
						className="p-2 text-warn hover:bg-accent-soft hover:shadow-lg transition flex items-center bg-transparent border-none outline-none"
						style={{ boxShadow: "0 2px 8px 0 rgba(22,163,74,0.10)" }}
						title="Cerrar sesión"
					>
						{/* Icono de salida rojo */}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 64 64"
							className="w-7 h-7"
							fill="none"
						>
							<g>
								<rect
									x="28"
									y="8"
									width="28"
									height="48"
									rx="4"
									stroke="currentColor"
									strokeWidth="3"
									fill="none"
								/>
								<path
									d="M28 32H12"
									stroke="currentColor"
									strokeWidth="3"
									strokeLinecap="round"
								/>
								<polyline
									points="16,24 8,32 16,40"
									fill="none"
									stroke="currentColor"
									strokeWidth="3"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</g>
						</svg>
					</button>
				</div>
			</div>
		</div>
	);
}
