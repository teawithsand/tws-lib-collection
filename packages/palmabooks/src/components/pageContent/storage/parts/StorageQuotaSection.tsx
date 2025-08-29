import { useTransResolver } from "@/app/app.hooks"
import { Card, Group, Stack, Text, Title } from "@teawithsand/mlui"

interface StorageQuotaSectionProps {
	readonly storageEstimate: {
		quota: number
		usage: number
	}
}

/**
 * Storage quota section component that displays storage usage information.
 */
export const StorageQuotaSection = ({
	storageEstimate,
}: StorageQuotaSectionProps) => {
	const { resolve } = useTransResolver()

	return (
		<Card padding="lg" shadow="sm" withBorder>
			<Stack gap="md">
				<Title order={2}>{resolve((t) => t.storage.quota.title)}</Title>

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
	)
}
