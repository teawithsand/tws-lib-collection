import { useApp } from "@/app/app.hooks"
import { AutonomousAbookEdit } from "@/components/abook"
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

export const AbookEditPage = () => {
	const routeParams = useRouteParams()
	const abookId = routeParams.resolve(RouteParamsSchemas.idParamSchema)
	const app = useApp()

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
					<AutonomousAbookEdit
						abookServiceAtoms={abookServiceAtoms}
						abookId={abookId}
					/>
				</LoadingSuspenseBoundary>
			</Container>
		</AppLocalLayout>
	)
}
