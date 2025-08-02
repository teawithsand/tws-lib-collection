import { useTransResolver } from "@/app/app.hooks"
import { AbookForm } from "@/components/forms/abook"
import { Title } from "@mantine/core"
import { AbookData } from "@teawithsand/booklibr"
import styles from "./AbookCreate.module.scss"

interface AbookCreateProps {
	readonly onSubmit: (data: AbookData) => Promise<void>
	readonly onPostSubmitSuccess?: () => void
}

export const AbookCreate = ({
	onSubmit,
	onPostSubmitSuccess,
}: AbookCreateProps) => {
	const { resolve } = useTransResolver()

	const handleSubmit = async (data: AbookData) => {
		await onSubmit(data)
		if (onPostSubmitSuccess) {
			onPostSubmitSuccess()
		}
	}

	return (
		<div className={styles["abook-create__container"]}>
			<Title order={1} mb="xl" className={styles["abook-create__title"]}>
				{resolve((t) => t.audiobooks.form.createButton)}
			</Title>
			<AbookForm onSubmit={handleSubmit} />
		</div>
	)
}
