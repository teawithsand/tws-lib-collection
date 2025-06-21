import { FsrsParameters } from "@teawithsand/mintay-core"

/**
 * Default FSRS parameters for spaced repetition learning.
 * These values are commonly used defaults for effective learning.
 */
export const DEFAULT_FSRS_PARAMETERS: FsrsParameters = {
	requestRetention: 0.9, // 90% retention rate
	maximumInterval: 36500, // ~100 years in days
	w: [
		0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18,
		0.05, 0.34, 1.26, 0.29, 2.61, 0.2, 1.0,
	],
	enableFuzz: true,
	enableShortTerm: true,
}
