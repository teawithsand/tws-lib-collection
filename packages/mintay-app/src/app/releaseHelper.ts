import { LibraryBaseLogger, Logger, LoggerImpl } from "@teawithsand/llog"

const LOG_TAG = "DiReleaseHelper"

interface ReleaseEntry {
	readonly tag: string
	readonly releaser: () => Promise<void>
}

export class DiReleaseHelper {
	private readonly logger
	private readonly releaseStack: ReleaseEntry[] = []
	private readonly throwFromRelease

	constructor({
		logger,
		throwFromRelease = false,
	}: { logger?: Logger; throwFromRelease?: boolean } = {}) {
		this.logger =
			logger ??
			new LoggerImpl(
				new LibraryBaseLogger("mintay-app"),
			).createTaggedLogger(LOG_TAG)
		this.throwFromRelease = throwFromRelease
	}

	public readonly add = (
		tag: string,
		releaser: () => Promise<void>,
	): void => {
		this.releaseStack.push({ tag, releaser })
	}

	public readonly release = async (): Promise<void> => {
		const errors: Array<{ tag: string; error: unknown }> = []

		for (let i = this.releaseStack.length - 1; i >= 0; i--) {
			const entry = this.releaseStack[i]
			try {
				await entry.releaser()
			} catch (error) {
				this.logger.warn(
					LOG_TAG,
					`Failed to release ${entry.tag}:`,
					error,
				)
				errors.push({ tag: entry.tag, error })
			}
		}

		this.releaseStack.length = 0

		if (errors.length > 0 && this.throwFromRelease) {
			const errorMessage = `${errors.length} releaser(s) failed: ${errors.map((e) => e.tag).join(", ")}`
			throw new Error(errorMessage)
		}
	}
}
