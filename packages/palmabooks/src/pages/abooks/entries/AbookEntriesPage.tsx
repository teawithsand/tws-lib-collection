import { useApp } from "@/app/app.hooks"
import { AppLocalLayout } from "@/components"
import { AutonomousAbookEntryList } from "@/components/abook/entries"
import { AbookEntry, WithId } from "@teawithsand/booklibr"
import { Atom } from "@teawithsand/fstate"
import {
	Container,
	LoadingSuspenseBoundary,
	RouteParamsSchemas,
	useRouteParams,
} from "@teawithsand/mlui"
import { useMemo } from "react"

interface AbookEntriesPageContentProps {
	readonly entriesAtom: Atom<Promise<WithId<AbookEntry>[]>>
	readonly onRefresh: () => void
}

const AbookEntriesPageContent = ({
	entriesAtom,
	onRefresh,
}: AbookEntriesPageContentProps) => {
	return (
		<AutonomousAbookEntryList
			entriesAtom={entriesAtom}
			onRefresh={onRefresh}
		/>
	)
}

export const AbookEntriesPage = () => {
	const app = useApp()
	const params = useRouteParams()
	const id = params.resolve(RouteParamsSchemas.idParamSchema)

	const { entriesAtom, refreshEntries } = useMemo(() => {
		if (!id) {
			const emptyAtom = app.abookStoreService.getAbook("").entries
			return {
				entriesAtom: emptyAtom,
				refreshEntries: () => {},
			}
		}

		const abookOperations = app.abookStoreService.getAbook(id)
		return {
			entriesAtom: abookOperations.entries,
			refreshEntries: () => {
				app.atomStore.set(abookOperations.refresh)
			},
		}
	}, [app, id])

	return (
		<AppLocalLayout>
			<LoadingSuspenseBoundary>
				<Container fullWidth>
					<AbookEntriesPageContent
						entriesAtom={entriesAtom}
						onRefresh={refreshEntries}
					/>
				</Container>
			</LoadingSuspenseBoundary>
		</AppLocalLayout>
	)
}
