import type { FaultPoint } from "./types"

/**
 * Type-safe fault provider that enforces correct data types for each fault point.
 */
export interface FaultProvider<
	P extends Record<string, FaultPoint<string, readonly unknown[]>>,
> {
	faultPoint: <K extends string & keyof P>(
		faultPointName: K,
		...data: P[K]["data"] extends readonly unknown[] ? P[K]["data"] : never
	) => void
}
