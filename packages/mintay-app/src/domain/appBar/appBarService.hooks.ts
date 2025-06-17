import { useAtomValue, useSetAtom } from "@teawithsand/fstate"
import { useEffect } from "react"
import { useApp } from "../../app"
import { AppBarMutator } from "./appBarService"

/**
 * Hook that pushes an AppBarMutator onto the mutators stack with specified priority
 * and automatically removes it when the component unmounts
 */
export const useAppBarMutator = (
	mutator: AppBarMutator,
	priority: number = 0,
) => {
	const app = useApp()
	const pushMutator = useSetAtom(app.appBarService.pushMutator)
	const removeMutator = useSetAtom(app.appBarService.removeMutator)

	useEffect(() => {
		const id = pushMutator(mutator, priority)

		return () => {
			removeMutator(id)
		}
	}, [mutator, priority, pushMutator, removeMutator])
}

/**
 * Hook that returns the current AppBar state
 */
export const useAppBarState = () => {
	const app = useApp()
	return useAtomValue(app.appBarService.currentAppBarState)
}
