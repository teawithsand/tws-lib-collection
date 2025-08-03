import { useTransResolver } from "@/app/app.hooks"
import type { Abook, AbookEntry, WithId } from "@teawithsand/booklibr"
import { Button, Card, Divider, Stack, Text } from "@teawithsand/mlui"

interface AbookPreviewPageContentProps {
	readonly abook: Abook
	readonly abookEntries: Array<WithId<AbookEntry>>
	readonly abookId: string
}

/**
 * Abook preview page content component for viewing detailed audiobook information.
 */
export const AbookShow = ({
	abook,
	abookEntries,
	abookId,
}: AbookPreviewPageContentProps) => {
	const { resolve } = useTransResolver()

	return (
		<Stack gap="lg">
			{/* Header */}
			<Stack gap="md">
				<Stack gap="sm">
					<Text variant="h1">{abook.data.header.metadata.title}</Text>
					{abook.data.header.metadata.description && (
						<Text variant="subtitle" c="textSecondary">
							{abook.data.header.metadata.description}
						</Text>
					)}
				</Stack>
			</Stack>

			{/* Metadata Card */}
			<Card>
				<Stack gap="md">
					<Text variant="h2">
						{resolve((t) => t.abooks.preview.metadata)}
					</Text>
					<Stack gap="sm">
						{abook.data.header.metadata.description && (
							<>
								<Text variant="body1">
									<strong>
										{resolve(
											(t) => t.abooks.preview.description,
										)}
										:
									</strong>{" "}
									{abook.data.header.metadata.description}
								</Text>
								<Divider />
							</>
						)}

						<Text variant="body1">
							<strong>
								{resolve((t) => t.abooks.preview.duration)}:
							</strong>{" "}
							{resolve((t) =>
								t.abooks.preview.formatDuration(
									abook.aggregate.totalDurationMillis,
								),
							)}
						</Text>

						<Text variant="body1">
							<strong>
								{resolve((t) => t.abooks.preview.entryCount)}:
							</strong>{" "}
							{abook.aggregate.totalEntries} entries
						</Text>

						<Text variant="body2" color="textSecondary">
							{resolve((t) => t.abooks.preview.createdLabel)}:{" "}
							{new Date(
								Number(abook.data.header.createdAt),
							).toLocaleDateString()}
						</Text>
					</Stack>
				</Stack>
			</Card>

			{/* Entries Section */}
			<Card>
				<Stack gap="md">
					<Text variant="h2">
						{resolve((t) => t.abooks.preview.entries)}
					</Text>
					{abookEntries.length === 0 ? (
						<Text color="textSecondary">
							{resolve((t) => t.abooks.preview.noEntries)}
						</Text>
					) : (
						<Stack gap="sm">
							{abookEntries.map(
								(entry: WithId<AbookEntry>, index: number) => {
									const hasAudioMetadata =
										entry.data.aggregate.metadata?.metadata
											.audio.type === "success"
									const audioDuration =
										hasAudioMetadata &&
										entry.data.aggregate.metadata?.metadata
											.audio.type === "success"
											? (
													entry.data.aggregate
														.metadata.metadata
														.audio as {
														metadata: {
															duration: number
														}
													}
												).metadata.duration
											: 0

									return (
										<Card key={entry.id} variant="outlined">
											<Stack gap="xs">
												<Text variant="body1">
													<strong>
														{resolve((t) =>
															t.abooks.preview.entryTitle(
																index,
															),
														)}
													</strong>
												</Text>
												<Text
													variant="body2"
													color="textSecondary"
												>
													{resolve(
														(t) =>
															t.abooks.preview
																.sourceLabel,
													)}
													:{" "}
													{
														entry.data.data.source
															.type
													}
												</Text>
												<Text
													variant="caption"
													color="textSecondary"
												>
													{resolve(
														(t) =>
															t.abooks.preview
																.durationLabel,
													)}
													:{" "}
													{audioDuration > 0
														? resolve((t) =>
																t.abooks.preview.formatDuration(
																	audioDuration *
																		1000,
																),
															)
														: "Unknown"}
												</Text>
												<Text
													variant="caption"
													color="textSecondary"
												>
													{resolve(
														(t) =>
															t.abooks.preview
																.dispositionLabel,
													)}
													:{" "}
													{
														entry.data.data
															.disposition
													}
												</Text>
											</Stack>
										</Card>
									)
								},
							)}
						</Stack>
					)}
				</Stack>
			</Card>

			{/* Action Buttons */}
			<Stack gap="md">
				<Button
					variant="primary"
					onClick={() => {
						// TODO: Implement edit navigation
						console.log("Edit abook:", abookId)
					}}
				>
					{resolve((t) => t.abooks.preview.editButton)}
				</Button>
			</Stack>
		</Stack>
	)
}
