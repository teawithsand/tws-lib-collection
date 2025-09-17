import { AbookEntryAction, BaseAbookEntryListProps } from "../common/types"

export interface OperationAbookEntryListProps extends BaseAbookEntryListProps {
	readonly actions?: readonly AbookEntryAction[]
}
