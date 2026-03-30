import * as React from "react";
import { createRoot } from "react-dom/client";
import "../styles/index.css";
import AppRouter from "./router";
import { AuthProvider } from "./services/auth";

createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<AuthProvider>
			<AppRouter />
		</AuthProvider>
	</React.StrictMode>,
);
