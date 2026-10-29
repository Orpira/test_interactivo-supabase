import { useEffect, useState } from "react";

export function useMediaQuery(query: string) {
	const get = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : true);
	const [matches, setMatches] = useState(get);
	useEffect(() => {
		if (!window.matchMedia) return;
		const mql = window.matchMedia(query);
		const onChange = () => setMatches(mql.matches);
		onChange();
		mql.addEventListener("change", onChange);
		return () => mql.removeEventListener("change", onChange);
	}, [query]);
	return matches;
}
