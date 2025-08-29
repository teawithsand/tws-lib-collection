import { useApp, useTransResolver } from "@/app/app.hooks"
import { useAtomValue, useSetAtom } from "@teawithsand/fstate"
import { useMantineNotifications } from "@teawithsand/mlui"
import { useEffect } from "react"
import { StoragePageContent } from "./StoragePageContent"

const LOG_TAG = "AutonomousStoragePageContent"

/**
 * Autonomous storage page content component.
 * Handles its own state management and integrates with storage manager service.
 */
export const AutonomousStoragePageContent = () => {
	const app = useApp()
	const { resolve } = useTransResolver()
	const notifications = useMantineNotifications()
	const storageManagerService = app.storageManagerService

	const storageEstimate = useAtomValue(storageManagerService.storageEstimate)
	const isStoragePersisted = useAtomValue(
		storageManagerService.isStoragePersisted,
	)

	const refreshStorage = useSetAtom(storageManagerService.refreshStorage)
	const requestPersistence = useSetAtom(
		storageManagerService.requestPersistence,
	)

	useEffect(() => {
		refreshStorage()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const handleRefreshStorage = () => {
		refreshStorage()
	}

	const handleRefreshPage = () => {
		window.location.reload()
	}

	const handleRequestPersistence = async () => {
		try {
			const result = await requestPersistence()

			if (!result) {
				notifications.show({
					title: resolve((t) => t.common.error),
					message: resolve(
						(t) => t.storage.persistence.requestRejected,
					),
					color: "red",
					autoClose: 10_000,
				})
			}
			refreshStorage()
		} catch (error) {
			app.logger.warn(
				LOG_TAG,
				"User request for persistence filed",
				error,
			)

			notifications.show({
				title: resolve((t) => t.common.error),
				message: resolve((t) => t.storage.persistence.requestError),
				color: "red",
				autoClose: 10_000,
			})
		}
	}

	return (
		<StoragePageContent
			storageEstimate={storageEstimate}
			isStoragePersisted={isStoragePersisted}
			onRefreshStorage={handleRefreshStorage}
			onRefreshPage={handleRefreshPage}
			onRequestPersistence={handleRequestPersistence}
		/>
	)
}
