import { useTransResolver } from "@/app/app.hooks"
import { AbookCreateForm } from "@/components/abook/form"
import { AbookData } from "@teawithsand/booklibr"
import { Title } from "@teawithsand/mlui"
import { ReactNode } from "react"
import styles from "./AbookCreate.module.scss"

interface AbookCreateProps {
	readonly onSubmit: (data: AbookData) => Promise<void>
	readonly onPostSubmitSuccess?: () => void
	readonly error?: ReactNode
}

export const AbookCreate = ({
	onSubmit,
	onPostSubmitSuccess,
	error,
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
				{resolve((t) => t.abooks.form.createButton)}
			</Title>
			<AbookCreateForm onSubmit={handleSubmit} error={error} />
		</div>
	)
}
