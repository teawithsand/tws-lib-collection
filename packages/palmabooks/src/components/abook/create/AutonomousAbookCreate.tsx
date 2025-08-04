import { useApp, useTransResolver } from "@/app/app.hooks"
import { AbookCreateForm } from "@/components/abook/form"
import { Routes } from "@/router/routes"
import { AbookData } from "@teawithsand/booklibr"
import { useAtomCallback } from "@teawithsand/fstate"
import { Title, useNavigation } from "@teawithsand/mlui"
import { useCallback } from "react"
import styles from "./AutonomousAbookCreate.module.scss"

const LOG_TAG = "AutonomousAbookCreate"

/**
 * Autonomous audiobook creation component.
 * Handles the creation logic and navigation after successful creation.
 */
export const AutonomousAbookCreate = () => {
	const app = useApp()
	const { resolve } = useTransResolver()
	const { navigate } = useNavigation()
	const handleSubmit = useAtomCallback(
		useCallback(
			async (_get, set, abookData: AbookData) => {
				try {
					// Use the header data from the abook data to create the audiobook
					await set(
						app.abookStoreService.createAbook,
						abookData.header,
					)

					// Navigate back to the books list after successful creation
					navigate(Routes.books.navigate())
				} catch (e) {
					app.logger.warn(LOG_TAG, "Form submission filed", e)
					throw e
				}
			},
			[app.abookStoreService.createAbook, app.logger, navigate],
		),
	)

	return (
		<div className={styles["abook-create"]}>
			<Title order={1} mb="xl" className={styles["abook-create__title"]}>
				{resolve((t) => t.abooks.form.createButton)}
			</Title>
			<AbookCreateForm onSubmit={handleSubmit} />
		</div>
	)
}
