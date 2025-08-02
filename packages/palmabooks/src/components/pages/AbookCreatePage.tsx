import { Container, Title } from "@mantine/core"
import { AbookData } from "@teawithsand/booklibr"
import { useCallback } from "react"
import { useTransResolver } from "../../app/app.hooks"
import { AbookForm } from "../forms/abook"

export const AbookCreatePage: React.FC = () => {
	const { resolve } = useTransResolver()

	const handleSubmit = useCallback(async (data: AbookData) => {
		console.log("Creating new ABook:", data)

		// Here you would typically:
		// 1. Send the data to your backend API
		// 2. Store it in your database
		// 3. Navigate to the book's page or show a success message

		// For now, just log it
		alert("Book created successfully! Check console for details.")
	}, [])

	return (
		<Container size="md" py="xl">
			<Title order={1} mb="xl" ta="center">
				{resolve((t) => t.audiobooks.form.createPageTitle)}
			</Title>

			<AbookForm onSubmit={handleSubmit} />
		</Container>
	)
}
