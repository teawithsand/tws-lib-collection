import { useTransResolver } from "@/app/app.hooks"
import { Button, Card, Group, Stack, Text, Title } from "@teawithsand/mlui"

interface StoragePersistenceSectionProps {
	readonly isStoragePersisted: boolean
	readonly onRefreshPage: () => void
	readonly onRequestPersistence: () => Promise<void>
}

/**
 * Storage persistence section component that displays persistence status and controls.
 */
export const StoragePersistenceSection = ({
	isStoragePersisted,
	onRefreshPage,
	onRequestPersistence,
}: StoragePersistenceSectionProps) => {
	const { resolve } = useTransResolver()

	return (
		<Card padding="lg" shadow="sm" withBorder>
			<Stack gap="md">
				<Title order={2}>
					{resolve((t) => t.storage.persistence.title)}
				</Title>

				<Stack gap="sm">
					<Group justify="space-between">
						<Text fw={500}>
							{resolve((t) => t.storage.persistence.isPersistent)}
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
							{resolve((t) => t.storage.persistence.description)}
						</Text>
					)}

					{!isStoragePersisted && (
						<Button
							variant="light"
							onClick={onRequestPersistence}
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
							onClick={onRefreshPage}
							size="sm"
						>
							{resolve(
								(t) => t.storage.persistence.refreshPageButton,
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
	)
}
