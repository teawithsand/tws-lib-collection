/**
 * Represents a single fault point with its name and associated data types.
 */
export type FaultPoint<T extends string, D extends readonly unknown[]> = {
	readonly name: T
	readonly data: D
}

/**
 * Collection of fault points mapped by their names.
 */
export type FaultPoints<T extends string = string> = Record<
	T,
	FaultPoint<T, readonly unknown[]>
>

/**
 * Converts a record of fault point definitions to FaultPoints.
 * Takes a record where keys are fault point names and values are the data arrays.
 */
export type FaultPointsRecord<T extends Record<string, readonly unknown[]>> = {
	readonly [K in keyof T]: FaultPoint<K & string, T[K]>
}
