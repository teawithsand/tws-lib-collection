import { useApp, useTransResolver } from "@/app/app.hooks"
import { useAtomValue, useSetAtom } from "@teawithsand/fstate"
import { Button, Card, Group, Stack, Text, Title } from "@teawithsand/mlui"

/**
 * Storage page content component that displays browser storage information and management options.
 * Shows storage quota, usage, persistence status, and provides actions to refresh data.
 */
export const StoragePageContent = () => {
	const app = useApp()
	const { resolve } = useTransResolver()
	const storageManagerService = app.storageManagerService

	const storageEstimate = useAtomValue(storageManagerService.storageEstimate)
	const isStoragePersisted = useAtomValue(
		storageManagerService.isStoragePersisted,
	)

	const refreshStorage = useSetAtom(storageManagerService.refreshStorage)
	const requestPersistence = useSetAtom(
		storageManagerService.requestPersistence,
	)

	const handleRefreshStorage = () => {
		// Trigger refresh of both storage estimate and persistence status
		refreshStorage()
	}

	const handleRequestPersistence = async () => {
		await requestPersistence()
		// Refresh storage information after requesting persistence
		refreshStorage()
	}

	return (
		<Stack gap="lg">
			<Title order={1}>{resolve((t) => t.storage.pageTitle)}</Title>

			{/* Storage Quota Card */}
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
									t.storage.formatBytes(
										storageEstimate.usage,
									),
								)}
							</Text>
						</Group>

						<Group justify="space-between">
							<Text fw={500}>
								{resolve((t) => t.storage.quota.totalQuota)}
							</Text>
							<Text>
								{resolve((t) =>
									t.storage.formatBytes(
										storageEstimate.quota,
									),
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
