import { Title } from "@mantine/core"
import { useTransResolver } from "../../../app"
import { CollectionForm, type CollectionFormData } from "../../form/collection"
import styles from "./CollectionEdit.module.scss"

interface CollectionEditProps {
	readonly initialData: CollectionFormData
	readonly onSubmit: (data: CollectionFormData) => Promise<void>
}

export const CollectionEdit = ({
	initialData,
	onSubmit,
}: CollectionEditProps) => {
	const { resolve } = useTransResolver()

	return (
		<div className={styles["collection-edit__container"]}>
			<Title order={2} className={styles["collection-edit__title"]}>
				{resolve((t) => t.collection.form.editCollection())}
			</Title>
			<CollectionForm initialData={initialData} onSubmit={onSubmit} />
		</div>
	)
}
