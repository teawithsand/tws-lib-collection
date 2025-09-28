import { AbookEntryEditForm } from "@/components/abook/entry/form/edit"
import { AbookEntryEditFormInput } from "@/components/abook/entry/form/edit/abookEntryEditFormClass"
import { AbookEntryData } from "@teawithsand/booklibr"
import { Modal, Stack } from "@teawithsand/mlui"
import { useCallback, useState } from "react"

/**
 * Generic audiobook entry edit modal.
 *
 * This is a reusable modal component that accepts an action function as a prop.
 * It handles the UI for editing but delegates the actual save logic
 * to the parent component through the `onSave` prop.
 *
 * Use this when you want custom save logic or want to handle notifications
 * and navigation differently.
 */
interface AbookEntryEditModalProps {
	readonly opened: boolean
	readonly onClose: () => void
	readonly entryData: AbookEntryData
	readonly onSave: (
		updatedData: AbookEntryData,
		originalData: AbookEntryData,
	) => Promise<void>
}

export function AbookEntryEditModal({
	opened,
	onClose,
	entryData,
	onSave,
}: AbookEntryEditModalProps) {
	const [submitError, setSubmitError] = useState<string | null>(null)

	const initialFormData: AbookEntryEditFormInput = {
		name: entryData.name,
		disposition: entryData.disposition,
		ordinalNumber: entryData.ordinalNumber,
	}

	const handleSubmit = useCallback(
		async (updatedData: AbookEntryData, originalData: AbookEntryData) => {
			try {
				setSubmitError(null)
				await onSave(updatedData, originalData)
				onClose()
			} catch (error) {
				setSubmitError(
					error instanceof Error
						? error.message
						: "Failed to save entry",
				)
			}
		},
		[onSave, onClose],
	)

	const handleCancel = useCallback(() => {
		setSubmitError(null)
		onClose()
	}, [onClose])

	return (
		<Modal
			opened={opened}
			onClose={handleCancel}
			title="Edit Entry"
			size="md"
		>
			<Stack>
				<AbookEntryEditForm
					initialData={initialFormData}
					originalEntryData={entryData}
					onSubmit={handleSubmit}
					onCancel={handleCancel}
					error={submitError}
				/>
			</Stack>
		</Modal>
	)
}
