import { useApp, useTransResolver } from "@/app/app.hooks"
import { useAtomValue, useSetAtom } from "@teawithsand/fstate"
import {
	Button,
	Card,
	Group,
	Stack,
	Text,
	Title,
	useMantineNotifications,
} from "@teawithsand/mlui"
import { useEffect } from "react"

const LOG_TAG = "StoragePageContent"

export const StoragePageContent = () => {
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
		<Stack gap="lg">
			<Title order={1}>{resolve((t) => t.storage.pageTitle)}</Title>

			<Card padding="lg" shadow="sm" withBorder>
				<Stack gap="md">
					<Title order={2}>
						{resolve((t) => t.storage.quota.title)}
					</Title>

					<Stack gap="sm">
						<Group justify="space-between">
							<Text fw={500}>
								{resolve((t) => t.storage.quota.usedSpace)}
							</Text>
							<Text>
								{resolve((t) =>
									t.util.formatSize(storageEstimate.usage),
								)}
							</Text>
						</Group>

						<Group justify="space-between">
							<Text fw={500}>
								{resolve((t) => t.storage.quota.totalQuota)}
							</Text>
							<Text>
								{resolve((t) =>
									t.util.formatSize(storageEstimate.quota),
								)}
							</Text>
						</Group>

						<Group justify="space-between">
							<Text fw={500}>
								{resolve((t) => t.storage.quota.usage)}
							</Text>
							<Text>
								{resolve((t) =>
									t.storage.formatPercentage(
										storageEstimate.usage,
										storageEstimate.quota,
									),
								)}
							</Text>
						</Group>
					</Stack>
				</Stack>
			</Card>

			<Card padding="lg" shadow="sm" withBorder>
				<Stack gap="md">
					<Title order={2}>
						{resolve((t) => t.storage.persistence.title)}
					</Title>

					<Stack gap="sm">
						<Group justify="space-between">
							<Text fw={500}>
								{resolve(
									(t) => t.storage.persistence.isPersistent,
								)}
							</Text>
							<Text c={isStoragePersisted ? "green" : "orange"}>
								{resolve((t) =>
									t.storage.persistence.isPersisted(
										isStoragePersisted,
									),
								)}
							</Text>
						</Group>

						{!isStoragePersisted && (
							<Text size="sm" c="dimmed">
								{resolve(
									(t) => t.storage.persistence.description,
								)}
							</Text>
						)}

						{!isStoragePersisted && (
							<Button
								variant="light"
								onClick={handleRequestPersistence}
								size="sm"
							>
								{resolve(
									(t) => t.storage.persistence.requestButton,
								)}
							</Button>
						)}

						{!isStoragePersisted && (
							<Button
								variant="outline"
								onClick={handleRefreshPage}
								size="sm"
							>
								{resolve(
									(t) =>
										t.storage.persistence.refreshPageButton,
								)}
							</Button>
						)}

						{!isStoragePersisted && (
							<>
								{resolve(
									(t) =>
										t.storage.persistence
											.refreshPageDescription,
								)}
							</>
						)}
					</Stack>
				</Stack>
			</Card>

			<Card padding="lg" shadow="sm" withBorder>
				<Stack gap="md">
					<Title order={2}>
						{resolve((t) => t.storage.actions.title)}
					</Title>

					<Group>
						<Button variant="light" onClick={handleRefreshStorage}>
							{resolve((t) => t.storage.actions.refreshButton)}
						</Button>
					</Group>

					<Text size="sm" c="dimmed">
						{resolve((t) => t.storage.actions.refreshDescription)}
					</Text>
				</Stack>
			</Card>
		</Stack>
	)
}
