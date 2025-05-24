import { z } from "zod"

/**
 * Represents the parameters for the FSRS algorithm.
 */
export type FsrsParameters = {
	/**
	 * The desired retention rate (e.g., 0.9 for 90% retention).
	 */
	requestRetention: number
	/**
	 * The maximum interval in days that a card can have.
	 */
	maximumInterval: number
	/**
	 * The weights used in the FSRS algorithm.
	 */
	w: number[]
	/**
	 * Whether to enable fuzzing, which adds a small random delay to intervals.
	 */
	enableFuzz: boolean
	/**
	 * Whether to enable the short-term scheduling component of FSRS.
	 */
	enableShortTerm: boolean
}

export const fsrsParametersSchema = z.object({
	requestRetention: z.number(),
	maximumInterval: z.number(),
	w: z.array(z.number()),
	enableFuzz: z.boolean(),
	enableShortTerm: z.boolean(),
})
