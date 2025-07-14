import { BaseError, Errors } from "./error"

interface ReleaseEntry {
	readonly tag: string
	readonly releaser: () => Promise<void>
}

export const ReleaseHelperError = Errors.makeErrorTypeWithData<
	unknown[],
	typeof BaseError
>("ReleaseHelperError", BaseError)

export class ReleaseHelper {
	private readonly releaseStack: ReleaseEntry[] = []

	/**
	 * Adds an asynchronous releaser function to the stack.
	 */
	public readonly addAsync = (
		tag: string,
		releaser: () => Promise<void>,
	): void => {
		this.releaseStack.push({ tag, releaser })
	}

	/**
	 * @deprecated Use `addAsync` instead.
	 */
	public readonly add = this.addAsync

	/**
	 * Adds a synchronous releaser function to the stack.
	 */
	public readonly addSync = (tag: string, releaser: () => void): void => {
		this.releaseStack.push({ tag, releaser: async () => releaser() })
	}

	/**
	 * Runs all releasers.
	 *
	 * @throws `ReleaseHelperError` if any of them fails.
	 *
	 * Clears releasers stack.
	 */
	public readonly release = async (): Promise<void> => {
		const errors = await this.releaseNoThrow()

		if (errors.length > 0) {
			const errorMessage = `${errors.length} releaser(s) failed; See error data for more details; Setting 1st error as cause`
			throw new ReleaseHelperError(errorMessage, errors, errors[0]!)
		}
	}

	/**
	 * @returns Array of errors caught while calling releasers.
	 *
	 * Clears releasers stack.
	 */
	public readonly releaseNoThrow = async (): Promise<unknown[]> => {
		const errors: any[] = []

		for (let i = this.releaseStack.length - 1; i >= 0; i--) {
			const entry = this.releaseStack[i]
			if (!entry) continue
			try {
				await entry.releaser()
			} catch (error) {
				errors.push(error)
			}
		}

		this.releaseStack.length = 0

		return errors
	}
}
