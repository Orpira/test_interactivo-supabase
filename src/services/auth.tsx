import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { User, Session } from "@supabase/supabase-js";

type AuthContextType = {
	user: User | null;
	session: Session | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	loginWithRedirect: () => Promise<void>;
	loginWithGoogle: () => Promise<void>;
	logout: (options?: { logoutParams?: { returnTo?: string } }) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
	user: null,
	session: null,
	isAuthenticated: false,
	isLoading: true,
	loginWithRedirect: async () => {},
	loginWithGoogle: async () => {},
	logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			setUser(session?.user ?? null);
			setIsLoading(false);
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
			setUser(session?.user ?? null);
			setIsLoading(false);
		});

		return () => subscription.unsubscribe();
	}, []);

	const loginWithRedirect = async () => {
		await supabase.auth.signInWithOAuth({
			provider: "github",
			options: { redirectTo: window.location.origin },
		});
	};

	const loginWithGoogle = async () => {
		await supabase.auth.signInWithOAuth({
			provider: "google",
			options: { redirectTo: window.location.origin },
		});
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
