import { z } from "zod"

/**
 * Schema for backend collection data
 */
export const backendCollectionDataSchema = z.object({
	test: z.string(),
})

/**
 * Type for backend collection data
 */
export type BackendCollectionData = z.infer<typeof backendCollectionDataSchema>
