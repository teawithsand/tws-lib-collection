import { Pair } from "./defines.js"

/**
 * Store for managing pairs with operations to add, remove, and lookup by identifier.
 * Provides a centralized way to manage pairing information across the application.
 */
export class PairStore {
	private pairs = new Map<string, Pair>()

	/**
	 * Generates a unique identifier for a pair based on local and remote device names.
	 * @param pair - The pair to generate an identifier for
	 * @returns A unique identifier string
	 */
	private readonly generatePairId = (pair: Pair): string => {
		return `${pair.localDeviceName}::${pair.remoteDeviceName}`
	}

	/**
	 * Adds a pair to the store.
	 * If a pair with the same identifier already exists, it will be replaced.
	 * @param pair - The pair to add to the store
	 */
	public readonly add = (pair: Pair): void => {
		const pairId = this.generatePairId(pair)
		this.pairs.set(pairId, pair)
	}

	/**
	 * Removes a pair from the store by its identifier.
	 * @param localDeviceName - The local device name
	 * @param remoteDeviceName - The remote device name
	 * @returns true if the pair was removed, false if it didn't exist
	 */
	public readonly remove = (
		localDeviceName: string,
		remoteDeviceName: string,
	): boolean => {
		const pairId = `${localDeviceName}::${remoteDeviceName}`
		return this.pairs.delete(pairId)
	}

	/**
	 * Looks up a pair by device names.
	 * @param localDeviceName - The local device name
	 * @param remoteDeviceName - The remote device name
	 * @returns The pair if found, undefined otherwise
	 */
	public readonly lookup = (
		localDeviceName: string,
		remoteDeviceName: string,
	): Pair | undefined => {
		const pairId = `${localDeviceName}::${remoteDeviceName}`
		return this.pairs.get(pairId)
	}

	/**
	 * Gets all pairs currently stored in the store.
	 * @returns An array of all pairs in the store
	 */
	public readonly getAll = (): Pair[] => {
		return Array.from(this.pairs.values())
	}

	/**
	 * Gets the number of pairs currently stored.
	 * @returns The count of pairs in the store
	 */
	public readonly size = (): number => {
		return this.pairs.size
	}

	/**
	 * Clears all pairs from the store.
	 */
	public readonly clear = (): void => {
		this.pairs.clear()
	}

	/**
	 * Checks if a pair with the given device names exists in the store.
	 * @param localDeviceName - The local device name
	 * @param remoteDeviceName - The remote device name
	 * @returns true if the pair exists, false otherwise
	 */
	public readonly has = (
		localDeviceName: string,
		remoteDeviceName: string,
	): boolean => {
		const pairId = `${localDeviceName}::${remoteDeviceName}`
		return this.pairs.has(pairId)
	}
}
