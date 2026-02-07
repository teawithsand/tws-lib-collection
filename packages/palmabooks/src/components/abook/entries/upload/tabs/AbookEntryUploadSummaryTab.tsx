import { useApp, useTransResolver } from "@/app/app.hooks"
import { IconAlertCircle, IconUpload } from "@tabler/icons-react"
import { useAtomValue, useSetAtom } from "@teawithsand/fstate"
import { Alert, Box, Button, Stack, Text } from "@teawithsand/mlui"
import { useAbookEntryUploadBehavior } from "../AbookEntryUploadBehavior"
import styles from "../AbookEntryUpload.module.scss"

export interface AbookEntryUploadSummaryTabProps {
	readonly filesCount: number
}

export const AbookEntryUploadSummaryTab = ({
	filesCount,
}: AbookEntryUploadSummaryTabProps) => {
	const { resolve } = useTransResolver()
	const app = useApp()
	const behavior = useAbookEntryUploadBehavior()
	const isUploading = useAtomValue(behavior.isUploading)
	const uploadErrors = useAtomValue(behavior.uploadErrors)
	const totalSize = useAtomValue(behavior.totalSize)
	const startUpload = useSetAtom(behavior.startUpload)
	const storageEstimate = useAtomValue(
		app.storageManagerService.storageEstimate,
	)

	const filesSummary =
		filesCount === 0
			? resolve((t) => t.abook.create.form.filesPlaceholder)
			: resolve((t) => t.abook.addFilesWizard.uploadTab.filesCountSummary(filesCount))

	const totalSizeAfterStore = storageEstimate.usage + totalSize
	const freeSpaceAfterStore =
		storageEstimate.quota > 0
			? Math.max(0, storageEstimate.quota - totalSizeAfterStore)
			: undefined

	return (
		<Stack gap="md" className={styles["abook-entry-upload__tab"]}>
			<Stack gap="xs">
				<Text size="md" fw={600}>
					{filesSummary}
				</Text>
				{filesCount > 0 && (
					<table className={styles["abook-entry-upload__summary-table"]}>
						<tbody>
							<tr>
								<td
									className={styles["abook-entry-upload__summary-label"]}
								>
									<Text size="sm" fw={600}>
										{resolve(
											(t) =>
												t.abook.addFilesWizard.uploadTab
													.filesCountLabel,
										)}
									</Text>
								</td>
								<td
									className={styles["abook-entry-upload__summary-value"]}
								>
									<Text size="sm" fw={600}>
										{filesCount}
									</Text>
								</td>
							</tr>
							<tr>
								<td
									className={styles["abook-entry-upload__summary-label"]}
								>
									<Text size="sm" fw={600}>
										{resolve(
											(t) =>
												t.abook.addFilesWizard.uploadTab
													.newFilesSizeLabel,
										)}
									</Text>
								</td>
								<td
									className={styles["abook-entry-upload__summary-value"]}
								>
									<Text size="sm" fw={600}>
										{resolve((t) => t.util.formatSize(totalSize))}
									</Text>
								</td>
							</tr>
							<tr>
								<td
									className={styles["abook-entry-upload__summary-label"]}
								>
									<Text size="sm" fw={600}>
										{resolve(
											(t) =>
												t.abook.addFilesWizard.uploadTab
													.totalSizeAfterLabel,
										)}
									</Text>
								</td>
								<td
									className={styles["abook-entry-upload__summary-value"]}
								>
									<Text size="sm" fw={600}>
										{resolve((t) => t.util.formatSize(totalSizeAfterStore))}
									</Text>
								</td>
							</tr>
							<tr>
								<td
									className={styles["abook-entry-upload__summary-label"]}
								>
									<Text size="sm" fw={600}>
										{resolve(
											(t) =>
												t.abook.addFilesWizard.uploadTab
													.freeSpaceAfterLabel,
										)}
									</Text>
								</td>
								<td
									className={styles["abook-entry-upload__summary-value"]}
								>
									<Text size="sm" fw={600}>
										{resolve((t) =>
											t.util.formatSize(freeSpaceAfterStore),
										)}
									</Text>
								</td>
							</tr>
							<tr>
								<td
									className={styles["abook-entry-upload__summary-label"]}
								>
									<Text size="sm" fw={600}>
										{resolve(
											(t) =>
												t.abook.addFilesWizard.uploadTab.filesCountAfterLabel,
										)}
									</Text>
								</td>
								<td
									className={styles["abook-entry-upload__summary-value"]}
								>
									<Text size="sm" fw={600}>
										{filesCount + behavior.abook.data.aggregate.totalEntries}
									</Text>
								</td>
							</tr>
						</tbody>
					</table>
				)}
			</Stack>

			{uploadErrors.length > 0 && (
				<Alert
					icon={<IconAlertCircle size="1rem" />}
					title={resolve((t) => t.common.error)}
					color="red"
					className={styles["abook-entry-upload__errors"]}
				>
					<Stack gap="xs">
						{uploadErrors.map((errorItem, index) => (
							<Text key={index} size="xs">
								{errorItem.file.name}: {errorItem.error.message}
							</Text>
						))}
					</Stack>
				</Alert>
			)}

			<Box className={styles["abook-entry-upload__actions"]}>
				<Button
					leftSection={<IconUpload size={16} />}
					onClick={() => startUpload()}
					disabled={filesCount === 0 || isUploading}
					loading={isUploading}
					fullWidth
				>
					{resolve((t) => t.abook.addFilesWizard.uploadTab.uploadButton)}
				</Button>
			</Box>
		</Stack>
	)
}
