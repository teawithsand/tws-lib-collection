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
	readonly onDeleteSelectedEntries?: (
		entries: WithId<AbookEntry>[],
	) => void | Promise<void>
}

const AbookEntriesPageContent = ({
	entriesAtom,
	abookAtom,
	onRefresh,
	onDeleteSelectedEntries,
}: AbookEntriesPageContentProps) => {
	return (
		<AutonomousAbookEntryList
			entriesAtom={entriesAtom}
			abookAtom={abookAtom}
			onRefresh={onRefresh}
			onDeleteSelectedEntries={onDeleteSelectedEntries}
		/>
	)
}

export const AbookEntriesPage = () => {
	const app = useApp()
	const params = useRouteParams()
	const id = params.resolve(RouteParamsSchemas.idParamSchema)

	const { entriesAtom, abookAtom, refreshEntries, deleteSelectedEntries } =
		useMemo(() => {
			if (!id) {
				const abookOps = app.abookStoreService.getAbook("")
				return {
					entriesAtom: abookOps.entries,
					abookAtom: abookOps.dataWithId,
					refreshEntries: () => {},
					deleteSelectedEntries: async () => {},
				}
			}

			const abookOperations = app.abookStoreService.getAbook(id)
			return {
				entriesAtom: abookOperations.entries,
				abookAtom: abookOperations.dataWithId,
				refreshEntries: () => {
					app.atomStore.set(abookOperations.refresh)
				},
				deleteSelectedEntries: async (
					entries: WithId<AbookEntry>[],
				) => {
					const abookHandle =
						await app.abookStoreService.abookStore.get(id)
					const entryHandles = await abookHandle.listEntries()
					const ids = new Set(entries.map((entry) => entry.id))
					for (const entryHandle of entryHandles) {
						if (ids.has(entryHandle.id)) {
							await entryHandle.delete()
						}
					}
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
						onDeleteSelectedEntries={deleteSelectedEntries}
					/>
				</Container>
			</LoadingSuspenseBoundary>
		</AppLocalLayout>
	)
}
