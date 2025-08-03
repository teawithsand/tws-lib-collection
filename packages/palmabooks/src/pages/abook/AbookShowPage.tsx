import { useApp } from "@/app/app.hooks"
import { AutonomousAbookShow } from "@/components/abook/show"
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

export const AbookShowPage = () => {
	const routeParams = useRouteParams()
	const abookId = routeParams.resolve(RouteParamsSchemas.idParamSchema)
	const app = useApp()

	useAppBarMutator(
		AppBarMutators.ARROW_BACK_MUTATOR,
		AppBarPredefinedMutatorPriorities.PAGE,
		app.appBarService,
	)

	const abookService = app.abookStoreService.getAbook(abookId)

	return (
		<AppLocalLayout>
			<Container>
				<LoadingSuspenseBoundary>
					<AutonomousAbookShow
						abookServiceAtom={abookService}
						abookId={abookId}
					/>
				</LoadingSuspenseBoundary>
			</Container>
		</AppLocalLayout>
	)
}
