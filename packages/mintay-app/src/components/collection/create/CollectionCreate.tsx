import { Title } from "@mantine/core"
import { useTransResolver } from "../../../app"
import { CollectionForm, type CollectionFormData } from "../../form/collection"
import styles from "./CollectionCreate.module.scss"

interface CollectionCreateProps {
	readonly onSubmit: (data: CollectionFormData) => Promise<void>
}

export const CollectionCreate = ({ onSubmit }: CollectionCreateProps) => {
	const { resolve } = useTransResolver()

	return (
		<div className={styles["collection-create__container"]}>
			<Title order={2} className={styles["collection-create__title"]}>
				{resolve((t) => t.collection.form.createCollection())}
			</Title>
			<CollectionForm onSubmit={onSubmit} />
		</div>
	)
}
