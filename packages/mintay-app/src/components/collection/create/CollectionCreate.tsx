import { useCallback } from "react"
import { useNavigate } from "react-router"
import { Routes } from "../../../router/routes"
import { CollectionForm, type CollectionFormData } from "../../form/collection"

/**
 * Component for creating new collections
 * Wraps the CollectionForm with creation-specific logic
 */
export const CollectionCreate = () => {
	const navigate = useNavigate()

	const handleSubmit = useCallback(
		async (data: CollectionFormData) => {
			try {
				// TODO: Implement actual collection creation logic here
				// This would typically involve calling an API or service
				console.log("Creating collection:", data)

				// Simulate API call
				await new Promise((resolve) => setTimeout(resolve, 1000))

				// For now, just log success and navigate
				console.log("Collection created successfully:", data.title)

				// Navigate back to collections list
				navigate(Routes.collections.navigate())
			} catch (error) {
				console.error("Failed to create collection:", error)

				// Re-throw to let the form handle the error
				throw error
			}
		},
		[navigate],
	)

	return <CollectionForm onSubmit={handleSubmit} />
}
