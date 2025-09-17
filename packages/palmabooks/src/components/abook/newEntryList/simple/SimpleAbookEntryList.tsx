import { AbookEntry, AbookEntrySourceType, WithId } from "@teawithsand/booklibr"
import { useAtomValue, useSetAtom } from "@teawithsand/fstate"
import { Loader, Stack, Text } from "@teawithsand/mlui"
import { Suspense } from "react"
import { SimpleAbookEntryListProps } from "./types"

/**
 * Simple entry card component for displaying basic entry information.
 */
const SimpleEntryCard = ({ entry }: { entry: WithId<AbookEntry> }) => {
	const fileName =
		entry.data.data.source.type === AbookEntrySourceType.UPLOAD
			? entry.data.data.source.uploadFileName
			: entry.id.toString()

	const disposition = entry.data.data.disposition

	return (
		<div
			style={{
				padding: "8px",
				border: "1px solid #e0e0e0",
				borderRadius: "4px",
				marginBottom: "4px",
			}}
		>
			<Text fw={500}>{fileName}</Text>
			<Text size="sm" c="dimmed">
				ID: {entry.id} | Disposition: {disposition}
			</Text>
		</div>
	)
}

/**
 * Simple save bar component for displaying modification status and actions.
 */
const SimpleSaveBar = ({
	isPristine,
	onSave,
	onClear,
}: {
	isPristine: boolean
	onSave: () => void
	onClear: () => void
}) => {
	if (isPristine) {
		return null
	}

	return (
		<div
			style={{
				padding: "8px",
				backgroundColor: "#f5f5f5",
				borderRadius: "4px",
				display: "flex",
				gap: "8px",
				alignItems: "center",
			}}
		>
			<Text size="sm">You have unsaved changes</Text>
			<button
				onClick={onSave}
				style={{
					padding: "4px 8px",
					backgroundColor: "#007bff",
					color: "white",
					border: "none",
					borderRadius: "4px",
					cursor: "pointer",
				}}
			>
				Save
			</button>
			<button
				onClick={onClear}
				style={{
					padding: "4px 8px",
					backgroundColor: "#6c757d",
					color: "white",
					border: "none",
					borderRadius: "4px",
					cursor: "pointer",
				}}
			>
				Discard
			</button>
		</div>
	)
}

/**
 * Internal component that handles the async entries list
 */
const SimpleAbookEntryListContent = ({
	behavior,
	onSaveChanges,
}: SimpleAbookEntryListProps) => {
	const entriesList = useAtomValue(behavior.entriesList)
	const isPristine = useAtomValue(behavior.isPristine)
	const clearModifications = useSetAtom(behavior.clear)

	const handleSave = () => {
		if (onSaveChanges) {
			onSaveChanges()
		} else {
			// This is a scaffold - actual save logic would go here
			// eslint-disable-next-line no-console
			console.log("Save changes (not implemented in scaffold)")
		}
	}

	const handleClear = () => {
		// Clear modifications by calling the atom's write function
		clearModifications()
	}

	return (
		<Stack gap="md">
			<SimpleSaveBar
				isPristine={isPristine}
				onSave={handleSave}
				onClear={handleClear}
			/>

			{entriesList && entriesList.length > 0 ? (
				<Stack gap="sm">
					{entriesList.map((entry) => (
						<SimpleEntryCard key={entry.id} entry={entry} />
					))}
				</Stack>
			) : (
				<Text c="dimmed" ta="center" py="xl">
					No entries found
				</Text>
			)}
		</Stack>
	)
}

/**
 * Non-autonomous simple abook entry list component.
 * Uses AbookEntryListBehavior for state management and displays entries in a simple format.
 */
export const SimpleAbookEntryList = (props: SimpleAbookEntryListProps) => {
	return (
		<Suspense fallback={<Loader />}>
			<SimpleAbookEntryListContent {...props} />
		</Suspense>
	)
}
