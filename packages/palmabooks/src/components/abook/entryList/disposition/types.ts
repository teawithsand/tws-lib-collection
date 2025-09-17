import {
	AbookEntryModifications,
	BaseAbookEntryListProps,
} from "../common/types"

export interface DispositionAbookEntryListProps
	extends BaseAbookEntryListProps {
	readonly onSaveChanges?: (modifications: AbookEntryModifications) => void
}
