import { Title } from "@mantine/core"
import { useTransResolver } from "../../../app"
import { CardForm, type CardFormData } from "../../form/card"
import styles from "./CardEdit.module.scss"

interface CardEditProps {
	readonly initialData: CardFormData
	readonly onSubmit: (data: CardFormData) => Promise<void>
}

export const CardEdit = ({ initialData, onSubmit }: CardEditProps) => {
	const { resolve } = useTransResolver()

	return (
		<div className={styles["card-edit__container"]}>
			<Title order={2} className={styles["card-edit__title"]}>
				{resolve((t) => t.card.form.editCard())}
			</Title>
			<CardForm initialData={initialData} onSubmit={onSubmit} />
		</div>
	)
}
