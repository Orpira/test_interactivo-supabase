import React, { createContext, useContext, useEffect, useState } from "react";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { supabase } from "./supabase";
import { getAuthRedirectUrl, isMobileAuthCallback } from "./authRedirect";
import type { Provider, User, Session } from "@supabase/supabase-js";

type AuthContextType = {
	user: User | null;
	session: Session | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	/** true tras abrir el enlace de "recuperar contraseña" del email */
	passwordRecovery: boolean;
	clearPasswordRecovery: () => void;
	loginWithRedirect: () => Promise<void>;
	loginWithGoogle: () => Promise<void>;
	logout: (options?: { logoutParams?: { returnTo?: string } }) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
	user: null,
	session: null,
	isAuthenticated: false,
	isLoading: true,
	passwordRecovery: false,
	clearPasswordRecovery: () => {},
	loginWithRedirect: async () => {},
	loginWithGoogle: async () => {},
	logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [passwordRecovery, setPasswordRecovery] = useState(false);

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			setUser(session?.user ?? null);
			setIsLoading(false);
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			// Supabase emite PASSWORD_RECOVERY al canjear el código del email de
			// recuperación (web y Android), con el mismo /auth/callback.
			if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
			if (event === "SIGNED_OUT") setPasswordRecovery(false);
			setSession(session);
			setUser(session?.user ?? null);
			setIsLoading(false);
		});

		let removeAppUrlOpenListener: (() => void) | undefined;

		if (Capacitor.isNativePlatform()) {
			App.addListener("appUrlOpen", async (event) => {
				if (!isMobileAuthCallback(event.url)) return;

				try {
					await Browser.close();
				} catch {
					// Android can close the Custom Tab before this callback runs.
				}

				const callbackUrl = new URL(event.url);
				const errorDescription =
					callbackUrl.searchParams.get("error_description");
				const code = callbackUrl.searchParams.get("code");

				if (errorDescription) {
					console.error("Supabase OAuth error:", errorDescription);
					return;
				}

				window.history.replaceState({}, document.title, "/");

				if (code) {
					const { data, error } = await supabase.auth.exchangeCodeForSession(
						code
					);
					if (error) {
						console.error("Could not exchange Supabase OAuth code:", error);
					} else if (
						(data as { redirectType?: string | null }).redirectType ===
						"recovery"
					) {
						// En el canje manual (Android) Supabase solo emite SIGNED_IN
						setPasswordRecovery(true);
					}
				}
			}).then((listener) => {
				removeAppUrlOpenListener = () => {
					void listener.remove();
				};
			});
		}

		return () => {
			subscription.unsubscribe();
			removeAppUrlOpenListener?.();
		};
	}, []);

	const signInWithProvider = async (provider: Provider) => {
		const isNative = Capacitor.isNativePlatform();
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider,
			options: {
				redirectTo: getAuthRedirectUrl(),
				skipBrowserRedirect: isNative,
			},
		});

		if (error) throw error;

		if (isNative && data.url) {
			await Browser.open({ url: data.url });
		}
	};

	const loginWithRedirect = async () => {
		await signInWithProvider("github");
	};

	const loginWithGoogle = async () => {
		await signInWithProvider("google");
	};

	const logout = async () => {
		await supabase.auth.signOut();
		window.location.href = "/";
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				session,
				isAuthenticated: !!user,
				isLoading,
				passwordRecovery,
				clearPasswordRecovery: () => setPasswordRecovery(false),
				loginWithRedirect,
				loginWithGoogle,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}
