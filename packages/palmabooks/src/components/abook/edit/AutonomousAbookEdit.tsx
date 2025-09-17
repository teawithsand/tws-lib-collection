import { useApp, useTransResolver } from "@/app/app.hooks"
import { AbookStoreServiceAbookAtoms } from "@/domain"
import { Routes } from "@/router/routes"
import { AbookData } from "@teawithsand/booklibr"
import { useAtomCallback, useAtomValue } from "@teawithsand/fstate"
import { useNavigation } from "@teawithsand/mlui"
import { useCallback, useState } from "react"
import { AbookEdit } from "./AbookEdit"
import { AbookEditNotFound } from "./AbookEditNotFound"

const LOG_TAG = "AutonomousAbookEdit"

interface AutonomousAbookEditProps {
	readonly abookServiceAtoms: AbookStoreServiceAbookAtoms
	readonly abookId: string
}

/**
 * Autonomous audiobook edit component.
 * Handles the edit logic and navigation after successful update.
 */
export const AutonomousAbookEdit = ({
	abookServiceAtoms,
	abookId,
}: AutonomousAbookEditProps) => {
	const app = useApp()
	const { resolve } = useTransResolver()
	const { navigate } = useNavigation()
	const abook = useAtomValue(abookServiceAtoms.data)
	const [submitError, setSubmitError] = useState<string | null>(null)

	const handleSubmit = useAtomCallback(
		useCallback(
			async (_get, set, abookData: AbookData) => {
				try {
					setSubmitError(null)
					await set(abookServiceAtoms.update, {
						data: abookData.header,
					})

					navigate(Routes.abookShow.navigate(abookId))
				} catch (e) {
					app.logger.warn(
						LOG_TAG,
						"Abook edit form submission failed",
						e,
					)
					setSubmitError(resolve((t) => t.common.explainError(e)))
					throw e
				}
			},
			[abookServiceAtoms.update, app.logger, navigate, abookId, resolve],
		),
	)

	if (!abook) {
		return <AbookEditNotFound />
	}

	return (
		<AbookEdit abook={abook} onSubmit={handleSubmit} error={submitError} />
	)
}
