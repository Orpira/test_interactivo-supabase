import { useAuth } from "../../services/auth";
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

export default function PrivateRoute({ children }: { children: ReactNode }) {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading)
		return <p className="p-6 text-center">Cargando autenticación...</p>;

	return isAuthenticated ? children : <Navigate to="/" replace />;
}
