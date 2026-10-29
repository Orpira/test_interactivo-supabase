import { useCallback, useEffect, useRef, useState } from "react";
import { runChallengeTests } from "../engine/runner";
import type { ChallengeFiles, ChallengeTest, TestResult } from "../engine/types";

export const LIVE_TESTS_DEBOUNCE_MS = 600;

/**
 * Ejecuta los tests automáticamente 600 ms después de dejar de escribir.
 * Ignora resultados de ejecuciones antiguas si llega una más reciente.
 */
export function useLiveTests(files: ChallengeFiles, tests: ChallengeTest[]) {
	const [results, setResults] = useState<TestResult[] | null>(null);
	const [running, setRunning] = useState(false);
	const [runs, setRuns] = useState(0);
	const version = useRef(0);

	const runNow = useCallback(async (): Promise<TestResult[]> => {
		const mine = ++version.current;
		setRunning(true);
		const res = await runChallengeTests(files, tests);
		if (mine === version.current) {
			setResults(res);
			setRunning(false);
			setRuns((n) => n + 1);
		}
		return res;
	}, [files, tests]);

	useEffect(() => {
		const t = setTimeout(() => void runNow(), LIVE_TESTS_DEBOUNCE_MS);
		return () => clearTimeout(t);
	}, [runNow]);

	return { results, running, runs, runNow };
}
