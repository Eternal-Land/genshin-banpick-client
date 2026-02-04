import { useCallback, useRef } from "react";

export function useDebounce(fn: (...args: any[]) => void, delayMs: number) {
	const timerRef = useRef<number | null>(null);

	return useCallback(
		(...args: any[]) => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}

			timerRef.current = setTimeout(() => {
				fn(...args);
			}, delayMs);
		},
		[fn, delayMs],
	);
}
