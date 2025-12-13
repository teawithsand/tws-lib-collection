import { Abook, WithId } from "@teawithsand/booklibr"
import { AbookEditForm } from "./form/abookEditForm"
import { AbookEditFormData } from "./form/abookEditFormClass"

export interface AbookEditData {
	title: string
	description: string
	privateNote: string
}

interface AbookEditProps {
	abook: WithId<Abook>
	onSubmit: (data: AbookEditData) => Promise<void>
}

export const AbookEdit: React.FC<AbookEditProps> = ({ abook, onSubmit }) => {
	const handleSubmit = async (formData: AbookEditFormData) => {
		const editData: AbookEditData = {
			title: formData.title,
			description: formData.description,
			privateNote: formData.privateNote,
		}
		await onSubmit(editData)
	}

	const initialData: Partial<AbookEditFormData> = {
		title: abook.data.data.header.metadata.title,
		description: abook.data.data.header.metadata.description,
		privateNote: abook.data.data.header.metadata.privateUserNote,
	}

	return <AbookEditForm initialData={initialData} onSubmit={handleSubmit} />
}
