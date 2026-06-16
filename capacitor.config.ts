import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
	appId: "com.orpira.webwizquiz",
	appName: "WebWiz Quiz",
	webDir: "dist",
	server: {
		androidScheme: "https",
	},
	plugins: {
		SplashScreen: {
			launchAutoHide: true,
			launchShowDuration: 1800,
			backgroundColor: "#0f172a",
			androidScaleType: "CENTER_CROP",
			showSpinner: false,
			splashFullScreen: true,
			splashImmersive: true,
		},
	},
};

export default config;
