import { immerable } from "immer"

/**
 * Utility class to facilitate testing of Immer-compatible classes.
 *
 * Provides methods for verifying that an object instance complies with Immer conventions,
 * specifically that it is properly marked as immerable and does not contain unexpected function properties.
 *
 * This class is designed primarily for use in test environments, such as Vitest,
 * and behavior may vary or be unreliable in other runtime contexts depending on TypeScript configuration.
 */
export class ImmerClassTesting {
	private constructor() {}

	/**
	 * Checks if the given instance is a valid simple Immer-compatible object, without throwing exceptions.
	 *
	 * The check verifies:
	 * - The instance is marked with the special `immerable` symbol (indicating Immer compatibility).
	 * - None of the own enumerable properties (excluding prototype methods) are functions.
	 *
	 * ### Important Usage Notices:
	 * - This method is designed for testing purposes and relies on runtime metadata that may depend on your TypeScript
	 *   configuration (`tsconfig.json`) and environment. It may not work correctly outside test environments like Vitest.
	 * - Does not throw an error; returns a boolean indicating whether the instance passes the test.
	 *
	 * @template T The instance object type.
	 * @param instance T - The object instance to test for Immer compatibility.
	 * @returns boolean - True if the instance is Immerable and contains no function-valued own enumerable properties; otherwise false.
	 */
	public static readonly simpleTestNoThrow = <T extends {}>(
		instance: T,
	): boolean => {
		if (!(instance as any)[immerable]) {
			return false
		}

		const ignoreSet = new Set(
			Object.getOwnPropertyNames(Object.getPrototypeOf(instance)),
		)

		for (const property of Object.keys(instance)) {
			if (ignoreSet.has(property)) continue

			const value = (instance as any)[property]
			if (typeof value === "function") return false
		}

		return true
	}
}
