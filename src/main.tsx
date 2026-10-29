import * as React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "../styles/index.css";
import AppRouter from "./router";
import { AuthProvider } from "./services/auth";
import { LazyMotion } from "framer-motion";

// El motor de animaciones se descarga aparte para no frenar la primera pintura
const loadMotionFeatures = () => import("./motionFeatures").then((m) => m.default);

createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<LazyMotion features={loadMotionFeatures} strict>
			<AuthProvider>
				<AppRouter />
			</AuthProvider>
		</LazyMotion>
	</React.StrictMode>,
);
