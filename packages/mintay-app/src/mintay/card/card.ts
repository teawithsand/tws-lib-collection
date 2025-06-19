import { MarkdownContent } from "@/domain/markdown/content"

export type AppCardData = {
	globalId: string
	discoveryPriority: number

	questionContent: MarkdownContent
	answerContent: MarkdownContent

	createdAt: number // Timestamp in milliseconds
	updatedAt: number // Timestamp in milliseconds
}

export const defaultCardDataFactory = (): AppCardData => ({
	globalId: "",
	questionContent: "",
	answerContent: "",
	discoveryPriority: 0,
	createdAt: 0,
	updatedAt: 0,
})
