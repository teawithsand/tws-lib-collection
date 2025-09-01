import { useTransResolver } from "@/app/app.hooks"
import { AbookUploadForm } from "@/components/abook/form/upload/abookUploadForm"
import { AdvancedFileFieldEntry } from "@/components/field/advancedFileField/AdvancedFileField"
import { Abook } from "@teawithsand/booklibr"
import { Button, Group, Stack, Title } from "@teawithsand/mlui"
import { ReactNode, useCallback } from "react"
import styles from "./abookUpload.module.scss"

interface AbookUploadProps {
	readonly abook: Abook
	readonly abookId: string
	readonly onSubmit: (files: AdvancedFileFieldEntry[]) => Promise<void>
	readonly onCancel?: () => void
	readonly error?: string | null
}

/**
 * Non-autonomous audiobook upload component.
 * Receives data and callbacks as props, making it suitable for Storybook and testing.
 */
export const AbookUpload = ({
	abook,
	onSubmit,
	onCancel,
	error,
}: AbookUploadProps) => {
	const { resolve } = useTransResolver()

	const handleSubmit = useCallback(
		async (files: AdvancedFileFieldEntry[]) => {
			await onSubmit(files)
		},
		[onSubmit],
	)

	const errorComponent: ReactNode = error ? error : undefined

	return (
		<div className={styles["abook-upload"]}>
			<Stack gap="xl">
				<div className={styles["abook-upload__header"]}>
					<Title order={1} className={styles["abook-upload__title"]}>
						{resolve((t) =>
							t.fileUpload.uploadTitle(
								abook.data.header.metadata.title,
							),
						)}
					</Title>
					<p className={styles["abook-upload__description"]}>
						{resolve((t) => t.fileUpload.uploadDescription)}
					</p>
				</div>

				<div className={styles["abook-upload__form"]}>
					<AbookUploadForm
						onSubmit={handleSubmit}
						error={errorComponent}
					/>
				</div>

				{onCancel && (
					<div className={styles["abook-upload__actions"]}>
						<Group justify="flex-end">
							<Button variant="outline" onClick={onCancel}>
								{resolve((t) => t.fileUpload.cancel)}
							</Button>
						</Group>
					</div>
				)}
			</Stack>
		</div>
	)
}
