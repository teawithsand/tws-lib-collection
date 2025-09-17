import type { AppTransString } from "@/trans/appTranslation"
import type {
	AbookEntry,
	AbookEntryDisposition,
	WithId,
} from "@teawithsand/booklibr"

export interface AbookEntryDisplayItem {
	readonly id: string
	readonly entry: WithId<AbookEntry>
	readonly name: string
	readonly disposition: AbookEntryDisposition
	readonly originalDisposition: AbookEntryDisposition
	readonly isModified: boolean
	readonly fileSize?: number
	readonly lastModified?: number
	readonly type?: string
	readonly hasSuccessfulMetadata?: boolean
}

export interface AbookEntryModifications {
	readonly [entryId: string]: AbookEntryDisposition
}

export interface AbookEntryAction {
	readonly onRun: (items: readonly AbookEntryDisplayItem[]) => Promise<void>
	readonly name: AppTransString
}

export interface AbookEntryFilterState {
	readonly searchText: string
	readonly dispositionFilter?: AbookEntryDisposition
}

export interface BaseAbookEntryListProps {
	readonly entries: readonly WithId<AbookEntry>[]
	readonly showMetadata?: boolean
}
