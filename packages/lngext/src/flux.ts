/**
 * Flux<T> monad that processes objects synchronously like a stream.
 */
export class Flux<T> {
	private readonly values: Iterable<T>

	private constructor(values: Iterable<T>) {
		this.values = values
	}

	/**
	 * Creates a new Flux from the given values.
	 */
	public static readonly of = <T>(values: Iterable<T>): Flux<T> => {
		return new Flux<T>(values)
	}

	/**
	 * Creates a new Flux from the given values as arguments.
	 */
	public static readonly from = <T>(...values: T[]): Flux<T> => {
		return new Flux<T>(values)
	}

	/**
	 * Creates an empty Flux.
	 */
	public static readonly empty = <T>(): Flux<T> => {
		return new Flux<T>([])
	}

	/**
	 * Maps each value in the Flux using the provided function.
	 */
	public readonly map = <R>(fn: (value: T) => R): Flux<R> => {
		const values = this.values
		const mapped = function* () {
			for (const value of values) {
				yield fn(value)
			}
		}

		return new Flux<R>(mapped())
	}

	/**
	 * Filters values in the Flux using the provided predicate.
	 */
	public readonly filter = (predicate: (value: T) => boolean): Flux<T> => {
		const values = this.values
		const filtered = function* () {
			for (const value of values) {
				if (predicate(value)) {
					yield value
				}
			}
		}

		return new Flux<T>(filtered())
	}

	/**
	 * Applies a flatMap operation using the provided function.
	 */
	public readonly flatMap = <R>(fn: (value: T) => Flux<R>): Flux<R> => {
		const values = this.values
		const flattened = function* () {
			for (const value of values) {
				const flux = fn(value)
				yield* flux.toArray()
			}
		}

		return new Flux<R>(flattened())
	}

	/**
	 * Performs the given action on each element of the Flux.
	 */
	public readonly forEach = (action: (value: T) => void): void => {
		for (const value of this.values) {
			action(value)
		}
	}

	/**
	 * Returns the first element that satisfies the provided predicate.
	 */
	public readonly find = (
		predicate: (value: T) => boolean,
	): T | undefined => {
		for (const value of this.values) {
			if (predicate(value)) {
				return value
			}
		}
		return undefined
	}

	/**
	 * Returns whether any elements match the provided predicate.
	 */
	public readonly some = (predicate: (value: T) => boolean): boolean => {
		for (const value of this.values) {
			if (predicate(value)) {
				return true
			}
		}
		return false
	}

	/**
	 * Returns whether all elements match the provided predicate.
	 */
	public readonly every = (predicate: (value: T) => boolean): boolean => {
		for (const value of this.values) {
			if (!predicate(value)) {
				return false
			}
		}
		return true
	}

	/**
	 * Reduces the elements of the Flux to a single value.
	 */
	public readonly reduce = <R>(
		reducer: (accumulator: R, value: T) => R,
		initialValue: R,
	): R => {
		let result = initialValue
		for (const value of this.values) {
			result = reducer(result, value)
		}
		return result
	}

	/**
	 * Concatenates another Flux to this one.
	 */
	public readonly concat = (other: Flux<T>): Flux<T> => {
		const values = this.values
		const otherValues = other.values
		const concatenated = function* () {
			yield* values
			yield* otherValues
		}

		return new Flux<T>(concatenated())
	}

	/**
	 * Returns the number of elements in the Flux.
	 */
	public readonly count = (): number => {
		let count = 0
		for (const _ of this.values) {
			count++
		}
		return count
	}

	/**
	 * Converts the Flux to an array.
	 */
	public readonly toArray = (): T[] => {
		return [...this.values]
	}

	/**
	 * Returns true if the Flux is empty.
	 */
	public readonly isEmpty = (): boolean => {
		// Check if the iterator has at least one value
		for (const _ of this.values) {
			return false
		}
		return true
	}

	/**
	 * Takes the first n elements from the Flux.
	 */
	public readonly take = (n: number): Flux<T> => {
		const values = this.values
		const taken = function* () {
			let count = 0
			for (const value of values) {
				if (count >= n) {
					break
				}
				yield value
				count++
			}
		}

		return new Flux<T>(taken())
	}

	/**
	 * Skips the first n elements and returns the rest.
	 */
	public readonly skip = (n: number): Flux<T> => {
		const values = this.values
		const skipped = function* () {
			let count = 0
			for (const value of values) {
				if (count >= n) {
					yield value
				}
				count++
			}
		}

		return new Flux<T>(skipped())
	}

	/**
	 * Creates an infinite flux by looping through the values.
	 * The original values will be repeated indefinitely.
	 */
	public readonly loop = (): Flux<T> => {
		const values = this.values
		const looped = function* () {
			const cached: T[] = []

			// First iteration: cache and yield values
			for (const value of values) {
				cached.push(value)
				yield value
			}

			// If no elements, stop here
			if (cached.length === 0) {
				return
			}

			// Infinite loop through cached values
			while (true) {
				for (const value of cached) {
					yield value
				}
			}
		}

		return new Flux<T>(looped())
	}

	/**
	 * Returns the last element of the Flux, or undefined if the Flux is empty.
	 */
	public readonly last = (): T | undefined => {
		let lastValue: T | undefined = undefined

		for (const value of this.values) {
			lastValue = value
		}

		return lastValue
	}
}
