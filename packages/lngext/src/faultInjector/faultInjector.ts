import type { FaultProvider } from "./faultProvider"
import type { FaultPoints } from "./types"

/**
 * Main fault injection coordinator that manages fault providers and delegates fault point calls.
 */
export class FaultInjector<TPoints extends FaultPoints> {
	private faultProvider: FaultProvider<TPoints> | null

	public constructor(faultProvider: FaultProvider<TPoints> | null = null) {
		this.faultProvider = faultProvider
	}

	public readonly clearFaultProvider = (): void => {
		this.setFaultProvider(null)
	}

	public readonly getFaultProvider = (): FaultProvider<TPoints> | null => {
		return this.faultProvider
	}

	public readonly setFaultProvider = (
		faultProvider: FaultProvider<TPoints> | null,
	): void => {
		this.faultProvider = faultProvider
	}

	public readonly faultPoint = <K extends string & keyof TPoints>(
		faultPointName: K,
		...data: TPoints[K]["data"] extends readonly unknown[]
			? TPoints[K]["data"]
			: never
	): void => {
		if (!this.faultProvider) return
		this.faultProvider.faultPoint(faultPointName, ...data)
	}
}
