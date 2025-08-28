import { useApp } from "@/app/app.hooks"
import { AutonomousAbookUploadFiles } from "@/components/abook/uploadFiles"
import { AppLocalLayout } from "@/components/layout"
import { Routes } from "@/router/routes"
import {
	AppBarMutators,
	AppBarPredefinedMutatorPriorities,
	Container,
	LoadingSuspenseBoundary,
	RouteParamsSchemas,
	useAppBarMutator,
	useNavigation,
	useRouteParams,
} from "@teawithsand/mlui"
import { useCallback } from "react"

export const AbookUploadFilesPage = () => {
	const routeParams = useRouteParams()
	const abookId = routeParams.resolve(RouteParamsSchemas.idParamSchema)
	const app = useApp()
	const { navigate } = useNavigation()

	useAppBarMutator(
		AppBarMutators.ARROW_BACK_MUTATOR,
		AppBarPredefinedMutatorPriorities.PAGE,
		app.appBarService,
	)

	const handleNavigateBack = useCallback(() => {
		navigate(Routes.abookShow.navigate(abookId))
	}, [navigate, abookId])

	const handleUploadComplete = useCallback(() => {
		navigate(Routes.abookShow.navigate(abookId))
	}, [navigate, abookId])

	return (
		<AppLocalLayout>
			<Container>
				<LoadingSuspenseBoundary>
					<AutonomousAbookUploadFiles
						abookId={abookId}
						onNavigateBack={handleNavigateBack}
						onUploadComplete={handleUploadComplete}
					/>
				</LoadingSuspenseBoundary>
			</Container>
		</AppLocalLayout>
	)
}
