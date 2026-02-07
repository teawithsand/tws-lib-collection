import { useApp } from "@/app/app.hooks"
import { AppLocalLayout, AutonomousAbookEntryUpload } from "@/components"
import { Abook, WithId } from "@teawithsand/booklibr"
import { Atom } from "@teawithsand/fstate"
import {
	Container,
	LoadingSuspenseBoundary,
	RouteParamsSchemas,
	useRouteParams,
} from "@teawithsand/mlui"
import { useMemo, useCallback } from "react"
import { useNavigation } from "@teawithsand/mlui"
import { Routes } from "@/router/routes"

interface AbookEntriesUploadPageContentProps {
	readonly abookDataWithIdAtom: Atom<Promise<WithId<Abook | null>>>
	readonly onUploadFinished: () => void
}

const AbookEntriesUploadPageContent = ({
	abookDataWithIdAtom,
	onUploadFinished,
}: AbookEntriesUploadPageContentProps) => {
	return (
		<AutonomousAbookEntryUpload
			abookDataWithIdAtom={abookDataWithIdAtom}
			onUploadFinished={onUploadFinished}
		/>
	)
}

export const AbookEntriesUploadPage = () => {
	const app = useApp()
	const params = useRouteParams()
	const id = params.resolve(RouteParamsSchemas.idParamSchema)
	const navigation = useNavigation()

	const { abookDataWithIdAtom } = useMemo(() => {
		if (!id) {
			const abookOps = app.abookStoreService.getAbook("")
			return {
				abookDataWithIdAtom: abookOps.dataWithId,
			}
		}

		const abookOps = app.abookStoreService.getAbook(id)
		return {
			abookDataWithIdAtom: abookOps.dataWithId,
		}
	}, [app, id])

	const handleUploadFinished = useCallback(() => {
		if (!id) return
		navigation.navigate(Routes.abookShow.navigate(id), {
			replace: true,
		})
	}, [navigation, id])

	return (
		<AppLocalLayout>
			<LoadingSuspenseBoundary>
				<Container size="md" fullWidth pt="md">
					<AbookEntriesUploadPageContent
						abookDataWithIdAtom={abookDataWithIdAtom}
						onUploadFinished={handleUploadFinished}
					/>
				</Container>
			</LoadingSuspenseBoundary>
		</AppLocalLayout>
	)
}
