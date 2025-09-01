import { useApp } from "@/app/app.hooks"
import { AutonomousAbookUpload } from "@/components/abook/upload"
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

/**
 * Page for uploading files to an audiobook.
 * Handles routing parameters and navigation after successful upload.
 */
export const AbookUploadPage = () => {
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
					<AutonomousAbookUpload
						abookServiceAtoms={abookServiceAtoms}
						abookId={abookId}
					/>
				</LoadingSuspenseBoundary>
			</Container>
		</AppLocalLayout>
	)
}
