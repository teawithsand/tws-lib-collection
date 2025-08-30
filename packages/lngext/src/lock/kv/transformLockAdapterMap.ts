import type { LockAdapter, RwLockAdapter } from "../lock"
import type { LockAdapterMap, RwLockAdapterMap } from "./lockAdapterMap"

/**
 * Implementation of LockAdapterMap that transforms keys using a transform function
 * before delegating to an inner LockAdapterMap.
 */
export class TransformLockAdapterMap implements LockAdapterMap {
	constructor(
		private readonly inner: LockAdapterMap,
		private readonly transform: (key: string) => string,
	) {}

	/**
	 * Gets a lock adapter for the transformed key from the inner map.
	 * @param key String identifier for the lock that will be transformed
	 * @returns LockAdapter instance for the transformed key
	 */
	public readonly getLock = (key: string): LockAdapter => {
		const transformedKey = this.transform(key)
		return this.inner.getLock(transformedKey)
	}
}

/**
 * Implementation of RwLockAdapterMap that transforms keys using a transform function
 * before delegating to an inner RwLockAdapterMap.
 */
export class TransformRwLockAdapterMap implements RwLockAdapterMap {
	constructor(
		private readonly inner: RwLockAdapterMap,
		private readonly transform: (key: string) => string,
	) {}

	/**
	 * Gets a read-write lock adapter for the transformed key from the inner map.
	 * @param key String identifier for the lock that will be transformed
	 * @returns RwLockAdapter instance for the transformed key
	 */
	public readonly getLock = (key: string): RwLockAdapter => {
		const transformedKey = this.transform(key)
		return this.inner.getLock(transformedKey)
	}
}
