import { z } from "zod"

/**
 * Schema for backend collection data
 */
export const backendCollectionDataSchema = z.object({
	collection: z.object({
		globalId: z.string(),
		title: z.string(),
		description: z.string().optional(),
	}),
	cards: z.array(
		z.object({
			globalId: z.string(),
			questionContent: z.string(),
			answerContent: z.string(),
		}),
	),
})

/**
 * Type for backend collection data
 */
export type BackendCollectionData = z.infer<typeof backendCollectionDataSchema>
