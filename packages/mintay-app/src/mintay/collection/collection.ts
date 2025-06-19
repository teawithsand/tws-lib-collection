export type AppCollectionData = {
	globalId: string

	title: string
	description: string

	createdAt: number // Timestamp in milliseconds
	updatedAt: number // Timestamp in milliseconds
}

export const defaultCollectionDataFactory = (): AppCollectionData => ({
	globalId: "",

	title: "",
	description: "",

	createdAt: 0,
	updatedAt: 0,
})
