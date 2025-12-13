import { useApp } from "@/app/app.hooks"
import { Routes } from "@/router/routes"
import { LoadingSuspenseBoundary, useNavigation } from "@teawithsand/mlui"
import { useCallback, useState } from "react"
import { AbookCreate } from "./AbookCreate"
import { AbookCreateBehavior, AbookCreateData } from "./AbookCreateBehavior"

const AbookCreateInternal = () => {
	const app = useApp()
	const navigation = useNavigation()
	const [behavior] = useState(
		() => new AbookCreateBehavior(app.abookStoreService),
	)

	const handleSubmit = useCallback(
		async (data: AbookCreateData) => {
			const result = await behavior.createAbookWithEntries(data)
			app.atomStore.set(app.abookStoreService.refreshAbooksList)
			navigation.navigate(
				Routes.abookShow.navigate(result.abookId.toString()),
				{
					replace: true,
				},
			)
		},
		[behavior, app, navigation],
	)

	return <AbookCreate onSubmit={handleSubmit} />
}

export const AutonomousAbookCreate = () => {
	return (
		<LoadingSuspenseBoundary>
			<AbookCreateInternal />
		</LoadingSuspenseBoundary>
	)
}
