import type { FaultProvider } from "./faultProvider"
import type { FaultPointsRecord } from "./types"

/**
 * Handler function type for fault points.
 * Receives the fault point data as arguments and can return any value or void.
 */
export type FaultPointHandler<D extends readonly unknown[]> = (
	...data: D
) => unknown

/**
 * Map of handlers for fault points.
 */
type FaultPointHandlers<T extends Record<string, readonly unknown[]>> = {
	readonly [K in keyof T]?: FaultPointHandler<T[K]>
}

export class FaultProviderBuilder<
	T extends Record<string, readonly unknown[]>,
> {
	private readonly handlers = new Map<
		keyof T,
		FaultPointHandler<readonly unknown[]>
	>()

	private constructor() {}

	/**
	 * Register a handler for a specific fault point.
	 *
	 * @param faultPointName - The name of the fault point
	 * @param handler - The handler function to register
	 * @returns The builder instance for method chaining
	 */
	public readonly register = <K extends keyof T>(
		faultPointName: K,
		handler: FaultPointHandler<T[K]>,
	): FaultProviderBuilder<T> => {
		this.handlers.set(
			faultPointName,
			handler as FaultPointHandler<readonly unknown[]>,
		)
		return this
	}

	/**
	 * Register multiple handlers at once using an object.
	 *
	 * @param handlerMap - Object mapping fault point names to their handlers
	 * @returns The builder instance for method chaining
	 */
	public readonly registerAll = (
		handlerMap: Partial<FaultPointHandlers<T>>,
	): FaultProviderBuilder<T> => {
		for (const [faultPointName, handler] of Object.entries(handlerMap)) {
			if (handler) {
				this.handlers.set(
					faultPointName as keyof T,
					handler as FaultPointHandler<readonly unknown[]>,
				)
			}
		}
		return this
	}

	/**
	 * Build and return the final fault provider.
	 *
	 * @returns The fault provider implementation
	 */
	public readonly build = (): FaultProvider<FaultPointsRecord<T>> => {
		return {
			faultPoint: <K extends string & keyof FaultPointsRecord<T>>(
				faultPointName: K,
				...data: FaultPointsRecord<T>[K]["data"] extends readonly unknown[]
					? FaultPointsRecord<T>[K]["data"]
					: never
			): void => {
				const handler = this.handlers.get(faultPointName as keyof T)
				if (handler) {
					// Type assertion is necessary here because we need to convert between the FaultProvider's
					// expected data format and the builder's internal data format
					handler(...(data as readonly unknown[]))
				}
			},
		}
	}

	/**
	 * Create a new FaultPointBuilder instance.
	 *
	 * @returns A new FaultPointBuilder instance
	 */
	public static readonly create = <
		T extends Record<string, readonly unknown[]>,
	>(): FaultProviderBuilder<T> => {
		return new FaultProviderBuilder<T>()
	}
}
