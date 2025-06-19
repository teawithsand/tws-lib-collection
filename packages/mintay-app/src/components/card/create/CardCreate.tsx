import { Title } from "@mantine/core"
import { useTransResolver } from "../../../app"
import { CardForm, type CardFormData } from "../../form/card"
import styles from "./CardCreate.module.scss"

interface CardCreateProps {
	readonly onSubmit: (data: CardFormData) => Promise<void>
}

export const CardCreate = ({ onSubmit }: CardCreateProps) => {
	const { resolve } = useTransResolver()

	return (
		<div className={styles["card-create__container"]}>
			<Title order={2} className={styles["card-create__title"]}>
				{resolve((t) => t.card.form.createCard())}
			</Title>
			<CardForm onSubmit={onSubmit} />
		</div>
	)
}
