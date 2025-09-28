import { useTransResolver } from "@/app/app.hooks"
import { useAtomValue } from "@teawithsand/fstate"
import { Box, Flex } from "@teawithsand/mlui"
import type { AbookEntryListBehavior } from "./behavior/AbookEntryListBehavior"
import {
	AbookEntryCard,
	AbookEntryFilter,
	AbookEntrySaveBar,
} from "./components"

interface AbookEntryListProps {
	readonly behavior: AbookEntryListBehavior
	readonly onSaveChanges: () => Promise<void>
	readonly abookId: string
}

/**
 * Abook entry list component that displays entries with filtering and editing capabilities.
 */
export const AbookEntryList = ({
	behavior,
	onSaveChanges,
	abookId,
}: AbookEntryListProps) => {
	const entries = useAtomValue(behavior.entriesList)
	const isPristine = useAtomValue(behavior.isPristine)
	const hasModifications = !isPristine
	const { resolve } = useTransResolver()

	return (
		<Box pos="relative">
			<Flex direction="column" gap="md">
				<AbookEntryFilter behavior={behavior} />

				{hasModifications && (
					<AbookEntrySaveBar
						behavior={behavior}
						onSaveChanges={onSaveChanges}
					/>
				)}

				<Flex direction="column" gap="sm">
					{entries.length === 0 ? (
						<Box ta="center" py="xl" c="dimmed">
							{resolve((t) => t.abooks.preview.noEntries)}
						</Box>
					) : (
						entries.map((entry) => (
							<AbookEntryCard
								key={entry.id}
								entry={entry}
								behavior={behavior}
								abookId={abookId}
							/>
						))
					)}
				</Flex>
			</Flex>
		</Box>
	)
}
