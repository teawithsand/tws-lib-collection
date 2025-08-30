import type { LockAdapter, LockAdapterMap } from "@teawithsand/lngext"
import { WebLockAdapter } from "../webLockAdapter"

/**
 * Implementation of LockAdapterMap that creates WebLockAdapter instances using transformed keys.
 * Uses a key transformation function to modify keys before creating lock adapters.
 */
export class WebLockAdapterMap implements LockAdapterMap {
	constructor(
		private readonly keyTransform: (key: string) => string = (x) => x,
	) {}

	/**
	 * Creates a WebLockAdapter for the specified key using the key transformation function.
	 * @param key String identifier for the lock
	 * @returns WebLockAdapter instance for the transformed key
	 */
	public readonly getLock = (key: string): LockAdapter => {
		const transformedKey = this.keyTransform(key)
		return new WebLockAdapter(transformedKey)
	}
}
