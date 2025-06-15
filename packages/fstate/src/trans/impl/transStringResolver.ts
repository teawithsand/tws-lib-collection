import { TransString, TransStringResolver } from "../defines"

/**
 * Implementation of TransStringResolver that resolves TransString instances
 * using a provided translation object.
 */
export class TransStringResolverImpl<T> implements TransStringResolver<T> {
	private readonly translation: T

	/**
	 * Creates a new TransStringResolverImpl instance.
	 * @param translation - The translation object to use for resolving strings
	 */
	constructor({ translation }: { translation: T }) {
		this.translation = translation
	}

	/**
	 * Resolves a TransString using the provided translation object.
	 * @param str - The TransString function to resolve
	 * @returns The resolved string
	 */
	public readonly resolve = (str: TransString<T>): string => {
		return str(this.translation)
	}
}
