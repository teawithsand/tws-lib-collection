import { useApp } from "@/app/app.hooks"
import { AppLocalLayout, AutonomousAbookList } from "@/components"
import { Abook, WithId } from "@teawithsand/booklibr"
import { Atom, useSetAtom } from "@teawithsand/fstate"
import { Container, LoadingSuspenseBoundary, Stack } from "@teawithsand/mlui"
import { useCallback } from "react"

interface AbookListPageContentProps {
	readonly abooksListAtom: Atom<Promise<WithId<Abook>[]>>
	onRefresh: () => void
}

const AbookListPageContent = ({
	abooksListAtom,
	onRefresh,
}: AbookListPageContentProps) => {
	return (
		<AutonomousAbookList
			abooksListAtom={abooksListAtom}
			onRefresh={onRefresh}
		/>
	)
}

export const AbookListPage = () => {
	const app = useApp()
	const setRefresh = useSetAtom(app.abookStoreService.refreshAbooksList)

	const handleRefresh = useCallback(() => {
		setRefresh()
	}, [setRefresh])

	return (
		<AppLocalLayout>
			<Container size="xl" py="xl" fullWidth>
				<Stack gap="lg">
					<LoadingSuspenseBoundary>
						<AbookListPageContent
							abooksListAtom={app.abookStoreService.abooksList}
							onRefresh={handleRefresh}
						/>
					</LoadingSuspenseBoundary>
				</Stack>
			</Container>
		</AppLocalLayout>
	)
}
