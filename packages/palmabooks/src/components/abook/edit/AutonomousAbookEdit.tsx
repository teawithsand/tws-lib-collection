import { useApp, useTransResolver } from "@/app/app.hooks"
import { AbookEditForm, AbookFormInput } from "@/components/abook/form"
import { AbookStoreServiceAbookAtoms } from "@/domain"
import { Routes } from "@/router/routes"
import { AbookData } from "@teawithsand/booklibr"
import { useAtomCallback, useAtomValue } from "@teawithsand/fstate"
import { Title, useNavigation } from "@teawithsand/mlui"
import { useCallback } from "react"
import { AbookEditNotFound } from "./AbookEditNotFound"
import styles from "./AutonomousAbookEdit.module.scss"

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

	const handleSubmit = useAtomCallback(
		useCallback(
			async (_get, set, abookData: AbookData) => {
				try {
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
					throw e
				}
			},
			[abookServiceAtoms.update, app.logger, navigate, abookId],
		),
	)

	if (!abook) {
		return <AbookEditNotFound />
	}

	const initialData: AbookFormInput = {
		title: abook.data.header.metadata.title,
		description: abook.data.header.metadata.description,
		privateUserNote: abook.data.header.metadata.privateUserNote,
	}

	return (
		<div className={styles["abook-edit"]}>
			<Title order={1} mb="xl" className={styles["abook-edit__title"]}>
				{resolve((t) => t.abooks.preview.editButton)}
			</Title>
			<AbookEditForm onSubmit={handleSubmit} initialData={initialData} />
		</div>
	)
}
