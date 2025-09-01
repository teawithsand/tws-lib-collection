import { useTransResolver } from "@/app/app.hooks"
import { AbookEditForm, AbookFormInput } from "@/components/abook/form"
import { Routes } from "@/router/routes"
import { IconCloudUpload } from "@tabler/icons-react"
import { AbookData } from "@teawithsand/booklibr"
import { Button, Group, Stack, Title, useNavigation } from "@teawithsand/mlui"
import { useCallback } from "react"
import { AbookEditNotFound } from "./AbookEditNotFound"
import styles from "./AutonomousAbookEdit.module.scss"

interface AbookEditProps {
	readonly abook: {
		data: {
			header: {
				metadata: {
					title: string
					description: string
					privateUserNote: string
				}
			}
		}
	} | null
	readonly abookId: string
	readonly onSubmit: (data: AbookData) => Promise<void>
	readonly error?: string | null
}

/**
 * Non-autonomous audiobook edit component.
 * Receives data and callbacks as props, making it suitable for Storybook and testing.
 */
export const AbookEdit = ({
	abook,
	abookId,
	onSubmit,
	error,
}: AbookEditProps) => {
	const { resolve } = useTransResolver()
	const { navigate } = useNavigation()

	const handleUploadClick = useCallback(() => {
		navigate(Routes.uploadFiles.navigate(abookId))
	}, [navigate, abookId])

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
			<Stack gap="xl">
				<div className={styles["abook-edit__header"]}>
					<Title order={1} className={styles["abook-edit__title"]}>
						{resolve((t) => t.abooks.preview.editButton)}
					</Title>
					<Group justify="flex-end" mt="md">
						<Button
							leftSection={<IconCloudUpload size="1rem" />}
							onClick={handleUploadClick}
							variant="outline"
						>
							{resolve((t) => t.fileUpload.label)}
						</Button>
					</Group>
				</div>

				<AbookEditForm
					onSubmit={onSubmit}
					initialData={initialData}
					error={error || undefined}
				/>
			</Stack>
		</div>
	)
}
