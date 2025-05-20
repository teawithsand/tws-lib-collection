/**
 * Enum representing the possible types of a Result
 */
export enum ResultType {
	/**
	 * Represents a successful result
	 */
	Ok = "ok",

	/**
	 * Represents a failed result
	 */
	Error = "error",
}

/**
 * A tagged union type representing either a successful result or an error
 */
export type ResultVariant<T, E = Error> =
	| { type: ResultType.Ok; value: T }
	| { type: ResultType.Error; error: E }

/**
 * Result monad that contains either a value of type T or an error of type E.
 */
export class Result<T, E = Error> {
	private constructor(
		private readonly value: T | undefined,
		private readonly error: E | undefined,
		private readonly isOk: boolean,
	) {}

	/**
	 * Creates a successful Result containing the given value.
	 */
	public static readonly ok = <T, E = Error>(value: T): Result<T, E> => {
		return new Result<T, E>(value, undefined, true)
	}

	/**
	 * Creates a failed Result containing the given error.
	 */
	public static readonly error = <T, E = Error>(error: E): Result<T, E> => {
		return new Result<T, E>(undefined, error, false)
	}

	/**
	 * Creates a Result from a ResultVariant.
	 */
	public static readonly fromType = <T, E = Error>(
		resultType: ResultVariant<T, E>,
	): Result<T, E> => {
		if (resultType.type === ResultType.Ok) {
			return Result.ok<T, E>(resultType.value)
		}
		return Result.error<T, E>(resultType.error)
	}

	/**
	 * Returns true if the Result is successful.
	 */
	public readonly isSuccess = (): boolean => {
		return this.isOk
	}

	/**
	 * Returns true if the Result is a failure.
	 */
	public readonly isFailure = (): boolean => {
		return !this.isOk
	}

	/**
	 * Returns the value if the Result is successful, or throws the error if it's a failure.
	 * @throws E if the Result is a failure
	 */
	public readonly unwrap = (): T => {
		if (!this.isOk) {
			throw this.error
		}
		return this.value as T
	}

	/**
	 * Returns the value if the Result is successful, or the provided default value if it's a failure.
	 */
	public readonly unwrapOr = (defaultValue: T): T => {
		return this.isOk ? (this.value as T) : defaultValue
	}

	/**
	 * Returns the value if the Result is successful, or the result of calling the fallback function with the error.
	 */
	public readonly unwrapOrElse = (fallback: (error: E) => T): T => {
		return this.isOk ? (this.value as T) : fallback(this.error as E)
	}

	/**
	 * Returns the error if the Result is a failure, or throws an error if it's successful.
	 * @throws Error if the Result is successful
	 */
	public readonly unwrapError = (): E => {
		if (this.isOk) {
			throw this.error
		}
		return this.error as E
	}

	/**
	 * Maps a Result<T, E> to Result<U, E> by applying the function to the contained value.
	 */
	public readonly map = <U>(fn: (value: T) => U): Result<U, E> => {
		if (this.isOk) {
			return Result.ok<U, E>(fn(this.value as T))
		}
		return Result.error<U, E>(this.error as E)
	}

	/**
	 * Maps a Result<T, E> to Result<T, F> by applying the function to the contained error.
	 */
	public readonly mapError = <F>(fn: (error: E) => F): Result<T, F> => {
		if (this.isOk) {
			return Result.ok<T, F>(this.value as T)
		}
		return Result.error<T, F>(fn(this.error as E))
	}

	/**
	 * Returns the provided result if this result is successful, otherwise returns the error.
	 */
	public readonly andThen = <U>(
		fn: (value: T) => Result<U, E>,
	): Result<U, E> => {
		if (this.isOk) {
			return fn(this.value as T)
		}
		return Result.error<U, E>(this.error as E)
	}

	/**
	 * Returns this result if it is a failure, otherwise evaluates the function and returns its result.
	 */
	public readonly orElse = (fn: (error: E) => Result<T, E>): Result<T, E> => {
		if (this.isOk) {
			return this
		}
		return fn(this.error as E)
	}

	/**
	 * Returns the ResultType of this Result.
	 */
	public get type(): ResultType {
		return this.isOk ? ResultType.Ok : ResultType.Error
	}

	/**
	 * Converts the Result to a tagged union type for exhaustive pattern matching in switch statements
	 */
	public readonly toType = (): ResultVariant<T, E> => {
		if (this.isOk) {
			return { type: ResultType.Ok, value: this.value as T }
		}
		return { type: ResultType.Error, error: this.error as E }
	}

	/**
	 * Executes the appropriate callback based on whether the Result is successful or a failure.
	 */
	public readonly match = <U>(options: {
		ok: (value: T) => U
		error: (error: E) => U
	}): U => {
		if (this.isOk) {
			return options.ok(this.value as T)
		}
		return options.error(this.error as E)
	}
}
