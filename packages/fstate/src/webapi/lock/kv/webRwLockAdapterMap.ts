import type { RwLockAdapter, RwLockAdapterMap } from "@teawithsand/lngext"
import { WebRwLockAdapter } from "../webRwLockAdapter"

/**
 * Implementation of RwLockAdapterMap that creates WebRwLockAdapter instances using transformed keys.
 * Uses a key transformation function to modify keys before creating read-write lock adapters.
 */
export class WebRwLockAdapterMap implements RwLockAdapterMap {
	constructor(
		private readonly keyTransform: (key: string) => string = (x) => x,
	) {}

	/**
	 * Creates a WebRwLockAdapter for the specified key using the key transformation function.
	 * @param key String identifier for the lock
	 * @returns WebRwLockAdapter instance for the transformed key
	 */
	public readonly getLock = (key: string): RwLockAdapter => {
		const transformedKey = this.keyTransform(key)
		return new WebRwLockAdapter(transformedKey)
	}
}
