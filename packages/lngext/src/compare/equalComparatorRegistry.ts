import { Constructor } from "../typeAssert"
import { EqualComparator } from "./equalComparator"

/**
 * Registry for storing custom EqualComparators for class-based types.
 * Allows global registration and retrieval of comparators based on constructor functions.
 */
export class EqualComparatorRegistry {
	private readonly comparators = new Map<
		Constructor<any>,
		EqualComparator<any>
	>()

	/**
	 * Registers a custom EqualComparator for the specified class type.
	 * @param constructor - The constructor function of the class type
	 * @param comparator - The EqualComparator implementation for the type
	 */
	public readonly register = <T>(
		constructor: Constructor<T>,
		comparator: EqualComparator<T>,
	): void => {
		this.comparators.set(constructor, comparator)
	}

	/**
	 * Retrieves the registered EqualComparator for the specified class type.
	 * @param constructor - The constructor function of the class type
	 * @returns The registered EqualComparator or undefined if not found
	 */
	public readonly get = <T>(
		constructor: Constructor<T>,
	): EqualComparator<T> | undefined => {
		return this.comparators.get(constructor)
	}

	/**
	 * Checks if a comparator is registered for the specified class type.
	 * @param constructor - The constructor function of the class type
	 * @returns True if a comparator is registered, false otherwise
	 */
	public readonly has = <T>(constructor: Constructor<T>): boolean => {
		return this.comparators.has(constructor)
	}

	/**
	 * Unregisters the EqualComparator for the specified class type.
	 * @param constructor - The constructor function of the class type
	 * @returns True if the comparator was found and removed, false otherwise
	 */
	public readonly unregister = <T>(constructor: Constructor<T>): boolean => {
		return this.comparators.delete(constructor)
	}

	/**
	 * Clears all registered comparators from the registry.
	 */
	public readonly clear = (): void => {
		this.comparators.clear()
	}

	/**
	 * Gets all registered constructor types.
	 * @returns An array of all registered constructor functions
	 */
	public readonly getRegisteredTypes = (): Constructor<any>[] => {
		return Array.from(this.comparators.keys())
	}
}

/**
 * Global instance of the EqualComparatorRegistry for convenient access.
 */
export const globalEqualComparatorRegistry = new EqualComparatorRegistry()
