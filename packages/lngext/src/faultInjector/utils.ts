import type { FaultProvider } from "./faultProvider"
import type { FaultPoints } from "./types"

/**
 * Creates a no-op fault provider that ignores all fault points.
 * Useful for disabling fault injection in production or testing scenarios.
 */
export const createNoOpFaultProvider = <
	TPoints extends FaultPoints,
>(): FaultProvider<TPoints> => {
	return {
		faultPoint: () => {
			// Intentionally empty - no-op implementation
		},
	}
}

/**
 * Creates a logging fault provider that logs all fault points to the console.
 * Useful for debugging and development scenarios.
 */
export const createLoggingFaultProvider = <TPoints extends FaultPoints>(
	logger: (
		faultPointName: string,
		data: readonly unknown[],
	) => void = console.log,
): FaultProvider<TPoints> => {
	return {
		faultPoint: <K extends string & keyof TPoints>(
			faultPointName: K,
			...data: TPoints[K]["data"] extends readonly unknown[]
				? TPoints[K]["data"]
				: never
		): void => {
			logger(`Fault point triggered: ${faultPointName}`, data)
		},
	}
}
