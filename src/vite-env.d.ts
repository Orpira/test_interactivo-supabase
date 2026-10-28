/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_SUPABASE_URL: string;
	readonly VITE_SUPABASE_ANON_KEY: string;
	readonly VITE_AUTH_REDIRECT_URL?: string;
	readonly VITE_MOBILE_AUTH_REDIRECT_URL?: string;
	/** Site key pública de hCaptcha (Supabase → Attack Protection) */
	readonly VITE_HCAPTCHA_SITE_KEY?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
