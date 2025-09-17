import { useApp } from "@/app/app.hooks"
import { AutonomousSimpleAbookEntryList } from "@/components/abook/newEntryList/simple/AutonomousSimpleAbookEntryList"
import { AppLocalLayout } from "@/components/layout"
import {
	AppBarMutators,
	AppBarPredefinedMutatorPriorities,
	Container,
	LoadingSuspenseBoundary,
	RouteParamsSchemas,
	useAppBarMutator,
	useRouteParams,
} from "@teawithsand/mlui"

export const FileListPage = () => {
	const app = useApp()
	const routeParams = useRouteParams()
	const abookId = routeParams.resolve(RouteParamsSchemas.idParamSchema)

	useAppBarMutator(
		AppBarMutators.ARROW_BACK_MUTATOR,
		AppBarPredefinedMutatorPriorities.PAGE,
		app.appBarService,
	)

	const abookServiceAtoms = app.abookStoreService.getAbook(abookId)

	return (
		<AppLocalLayout>
			<Container>
				<LoadingSuspenseBoundary>
					<AutonomousSimpleAbookEntryList
						abookServiceAtoms={abookServiceAtoms}
					/>
				</LoadingSuspenseBoundary>
			</Container>
		</AppLocalLayout>
	)
}
