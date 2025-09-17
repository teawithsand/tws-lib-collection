import type { AbookEntryListBehavior } from "../AbookEntryListBehavior"

export interface SimpleAbookEntryListProps {
	readonly behavior: AbookEntryListBehavior
	readonly showMetadata?: boolean
	readonly onSaveChanges?: () => void
}
