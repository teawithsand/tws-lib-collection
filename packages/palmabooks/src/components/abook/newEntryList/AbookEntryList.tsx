import { useAtomValue } from "@teawithsand/fstate"
import { Box, Flex, LoadingOverlay } from "@teawithsand/mlui"
import type { AbookEntryListBehavior } from "./behavior/AbookEntryListBehavior"
import {
	AbookEntryCard,
	AbookEntryFilter,
	AbookEntrySaveBar,
} from "./components"

interface AbookEntryListProps {
	readonly behavior: AbookEntryListBehavior
	readonly onSaveChanges: () => Promise<void>
}

/**
 * Abook entry list component that displays entries with filtering and editing capabilities.
 */
export const AbookEntryList = ({
	behavior,
	onSaveChanges,
}: AbookEntryListProps) => {
	const entries = useAtomValue(behavior.entriesList)
	const isPristine = useAtomValue(behavior.isPristine)
	const hasModifications = !isPristine
	const isLoading = false // Loading state not implemented in behavior

	return (
		<Box pos="relative">
			<LoadingOverlay visible={isLoading} />

			<Flex direction="column" gap="md">
				{/* Filter Section */}
				<AbookEntryFilter behavior={behavior} />

				{/* Save Bar - only shown when there are modifications */}
				{hasModifications && (
					<AbookEntrySaveBar
						behavior={behavior}
						onSaveChanges={onSaveChanges}
					/>
				)}

				{/* Entry List */}
				<Flex direction="column" gap="sm">
					{entries.length === 0 ? (
						<Box ta="center" py="xl" c="dimmed">
							No entries found
						</Box>
					) : (
						entries.map((entry) => (
							<AbookEntryCard
								key={entry.id}
								entry={entry}
								behavior={behavior}
							/>
						))
					)}
				</Flex>
			</Flex>
		</Box>
	)
}
