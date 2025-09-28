"use client"

import { useApp } from "@/app/app.hooks"
import { AutonomousAbookEntryShow } from "@/components/abook/entry/show/AutonomousAbookEntryShow"
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
import React from "react"

/**
 * Page component for displaying a single audiobook entry.
 * Handles routing parameters and displays the entry using AutonomousAbookEntryShow component.
 */
export const AbookEntryShowPage = (): React.ReactElement => {
	const routeParams = useRouteParams()

	const rawParams = routeParams.getRaw()
	const abookIdFromSchema = routeParams.resolve(
		RouteParamsSchemas.createStringParamSchema("abookId"),
	)
	const entryIdFromSchema = routeParams.resolve(
		RouteParamsSchemas.createStringParamSchema("entryId"),
	)

	const abookId = abookIdFromSchema || rawParams.abookId || ""
	const entryId = entryIdFromSchema || rawParams.entryId || ""

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
					<AutonomousAbookEntryShow
						abookServiceAtoms={abookServiceAtoms}
						abookId={abookId}
						entryId={entryId}
					/>
				</LoadingSuspenseBoundary>
			</Container>
		</AppLocalLayout>
	)
}
