import { useTransResolver } from "@/app/app.hooks"
import { AbookEditForm, AbookFormInput } from "@/components/abook/form"
import { AbookData } from "@teawithsand/booklibr"
import { Title } from "@teawithsand/mlui"
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
	readonly onSubmit: (data: AbookData) => Promise<void>
	readonly error?: string | null
}

/**
 * Non-autonomous audiobook edit component.
 * Receives data and callbacks as props, making it suitable for Storybook and testing.
 */
export const AbookEdit = ({ abook, onSubmit, error }: AbookEditProps) => {
	const { resolve } = useTransResolver()

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
			<Title order={1} mb="xl" className={styles["abook-edit__title"]}>
				{resolve((t) => t.abooks.preview.editButton)}
			</Title>
			<AbookEditForm
				onSubmit={onSubmit}
				initialData={initialData}
				error={error || undefined}
			/>
		</div>
	)
}
