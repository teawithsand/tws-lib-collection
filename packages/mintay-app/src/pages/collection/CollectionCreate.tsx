import { AutonomousCollectionCreate } from "@/components/collection/create/AutonomousCollectionCreate"
import {
	AppBarMutators,
	AppBarPredefinedMutatorPriorities,
	useAppBarMutator,
} from "@/domain/appBar"
import { LocalLayout } from "../../components/layout"

/**
 * Page for creating new collections
 */
export const CollectionCreatePage = () => {
	useAppBarMutator(
		AppBarMutators.ARROW_BACK_MUTATOR,
		AppBarPredefinedMutatorPriorities.PAGE,
	)

	return (
		<LocalLayout>
			<AutonomousCollectionCreate />
		</LocalLayout>
	)
}
