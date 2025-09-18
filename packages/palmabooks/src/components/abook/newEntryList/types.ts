import type { AbookEntryListBehavior } from "./behavior/AbookEntryListBehavior"

export interface AbookEntryListProps {
	readonly behavior: AbookEntryListBehavior
	readonly showMetadata?: boolean
	readonly onSaveChanges?: () => void
}
