import { BaseError, Errors } from "./error"

export const InvalidSleepTimeError = Errors.makeErrorType(
	"InvalidSleepTimeError",
	BaseError,
)

export const SleepCancelledError = Errors.makeErrorType(
	"SleepCancelledError",
	BaseError,
)

export type PromisesSleep = {
	cancel: () => void
	promise: Promise<void>
}

export class Promises {
	private constructor() {}

	/**
	 * Creates a deferred promise that can be resolved or rejected at any time.
	 *
	 * @template T The type of value the promise will resolve to
	 * @returns A tuple containing [promise, resolver, rejector] where:
	 *   - promise: A promise that will settle when resolver or rejector is called
	 *   - resolver: Function to resolve the promise with a value
	 *   - rejector: Function to reject the promise with an error
	 *
	 * @example
	 * ```typescript
	 * const [promise, resolve, reject] = Promises.latePromise<string>();
	 *
	 * // Later in code...
	 * resolve("Hello World");
	 *
	 * // Or to reject...
	 * reject(new Error("Something went wrong"));
	 * ```
	 */
	public static readonly latePromise = <T>(): [
		Promise<T>,
		(value: T) => void,
		(error: any) => void,
	] => {
		let rejector: null | ((error: any) => void) = null
		let resolver: null | ((value: T) => void) = null

		let isValueSet = false
		let isErrorSet = false
		let value: T = null as any
		let error: any = null

		const promise = new Promise<T>((resolve, reject) => {
			if (isValueSet) {
				resolve(value)
			} else if (isErrorSet) {
				reject(error)
			} else {
				resolver = resolve
				rejector = reject
			}
		})

		return [
			promise,
			(v) => {
				if (resolver != null) {
					resolver(v)
				} else {
					isValueSet = true
					value = v
				}
			},
			(err) => {
				if (rejector != null) {
					rejector(err)
				} else {
					isErrorSet = true
					error = err
				}
			},
		]
	}

	/**
	 * Silently handles promise rejections to prevent unhandled promise rejection warnings.
	 *
	 * @param promise The promise to handle
	 * @returns A promise that always resolves to void
	 *
	 * @example
	 * ```typescript
	 * // Fire-and-forget operation that might fail
	 * await Promises.dummyCatch(riskyOperation());
	 * ```
	 */
	public static readonly dummyCatch = async (
		promise: Promise<any>,
	): Promise<void> => {
		try {
			await promise
		} catch {}
	}

	/**
	 * Silently handles promise rejections without awaiting, preventing unhandled promise rejection warnings.
	 *
	 * @template T The type of value the promise resolves to
	 * @param promise The promise to handle in the background
	 *
	 * @example
	 * ```typescript
	 * // Fire-and-forget operation that might fail
	 * Promises.dummyCatchVoid(backgroundTask());
	 * ```
	 */
	public static readonly dummyCatchVoid = <T>(promise: Promise<T>): void => {
		void promise
			.then(() => {})
			.catch(() => {
				// ignore
			})
	}

	/**
	 * Pauses execution for the specified duration. Cannot be cancelled.
	 *
	 * @param timeMillis The number of milliseconds to sleep. Must be finite and non-negative.
	 * @returns A promise that resolves after the specified time
	 * @throws {InvalidSleepTimeError} When timeMillis is not finite or is negative
	 *
	 * @example
	 * ```typescript
	 * // Wait for 1 second
	 * await Promises.simpleSleep(1000);
	 * console.log("1 second has passed");
	 * ```
	 */
	public static readonly simpleSleep = (
		timeMillis: number,
	): Promise<void> => {
		if (!isFinite(timeMillis) || timeMillis < 0)
			throw new InvalidSleepTimeError(
				`Invalid simpleSleep time provided: ${timeMillis}`,
			)

		return new Promise((resolve) => {
			setTimeout(resolve, timeMillis)
		})
	}

	/**
	 * Pauses execution for the specified duration with cancellation support.
	 *
	 * @param timeMillis The number of milliseconds to sleep. Must be finite and non-negative.
	 * @returns An object with a promise that resolves after the time and a cancel function
	 * @throws {InvalidSleepTimeError} When timeMillis is not finite or is negative
	 *
	 * @example
	 * ```typescript
	 * const sleepOperation = Promises.sleep(5000);
	 *
	 * // Cancel after 2 seconds
	 * setTimeout(() => sleepOperation.cancel(), 2000);
	 *
	 * try {
	 *   await sleepOperation.promise;
	 *   console.log("Sleep completed");
	 * } catch (error) {
	 *   if (error instanceof SleepCancelledError) {
	 *     console.log("Sleep was cancelled");
	 *   }
	 * }
	 * ```
	 */
	public static readonly sleep = (timeMillis: number): PromisesSleep => {
		if (!isFinite(timeMillis) || timeMillis < 0)
			throw new InvalidSleepTimeError(
				`Invalid sleep time provided: ${timeMillis}`,
			)

		const [promise, resolve, reject] = Promises.latePromise<void>()
		let isDone = false
		const timeout = setTimeout(() => {
			if (isDone) return
			isDone = true
			resolve()
		}, timeMillis)

		return {
			cancel: () => {
				if (isDone) return
				isDone = true
				clearTimeout(timeout)
				reject(new SleepCancelledError(`Sleep was cancelled`))
			},
			promise,
		}
	}
}
