import { useApp } from "@/app/app.hooks"
import { AppLocalLayout } from "@/components"
import { AutonomousAbookEntryList } from "@/components/abook/entries"
import { Abook, AbookEntry, WithId } from "@teawithsand/booklibr"
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
	readonly abookAtom: Atom<Promise<WithId<Abook | null>>>
	readonly onRefresh: () => void
}

const AbookEntriesPageContent = ({
	entriesAtom,
	abookAtom,
	onRefresh,
}: AbookEntriesPageContentProps) => {
	return (
		<AutonomousAbookEntryList
			entriesAtom={entriesAtom}
			abookAtom={abookAtom}
			onRefresh={onRefresh}
		/>
	)
}

export const AbookEntriesPage = () => {
	const app = useApp()
	const params = useRouteParams()
	const id = params.resolve(RouteParamsSchemas.idParamSchema)

	const { entriesAtom, abookAtom, refreshEntries } = useMemo(() => {
		if (!id) {
			const abookOps = app.abookStoreService.getAbook("")
			return {
				entriesAtom: abookOps.entries,
				abookAtom: abookOps.dataWithId,
				refreshEntries: () => {},
			}
		}

		const abookOperations = app.abookStoreService.getAbook(id)
		return {
			entriesAtom: abookOperations.entries,
			abookAtom: abookOperations.dataWithId,
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
						abookAtom={abookAtom}
						onRefresh={refreshEntries}
					/>
				</Container>
			</LoadingSuspenseBoundary>
		</AppLocalLayout>
	)
}
