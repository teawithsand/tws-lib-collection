import { useAtomValue, useSetAtom } from "@teawithsand/fstate"
import { useEffect } from "react"
import type { AppBarMutator, AppBarService } from "./service"

/**
 * Hook that pushes an AppBarMutator onto the mutators stack with specified priority
 * and automatically removes it when the component unmounts.
 *
 * Note: mutator should be used with useCallback or similar solution, since otherwise new mutator will be set in each render.
 */
export const useAppBarMutator = (
	mutator: AppBarMutator,
	priority: number = 0,
	appBarService: AppBarService,
) => {
	const pushMutator = useSetAtom(appBarService.pushMutator)
	const removeMutator = useSetAtom(appBarService.removeMutator)

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
export const useAppBarState = (appBarService: AppBarService) => {
	return useAtomValue(appBarService.currentAppBarState)
}
