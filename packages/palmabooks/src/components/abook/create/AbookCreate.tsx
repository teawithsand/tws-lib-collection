import { AbookCreateData } from "./AbookCreateBehavior"
import { AbookCreateForm } from "./form/abookCreateForm"
import { AbookCreateFormData } from "./form/abookCreateFormClass"

interface AbookCreateProps {
	initialData?: Partial<AbookCreateData>
	onSubmit: (data: AbookCreateData) => Promise<void>
}

export const AbookCreate: React.FC<AbookCreateProps> = ({
	initialData,
	onSubmit,
}) => {
	const handleSubmit = async (formData: AbookCreateFormData) => {
		const createData: AbookCreateData = {
			title: formData.title,
			description: formData.description,
			privateNote: formData.privateNote,
			files: formData.files,
		}
		await onSubmit(createData)
	}

	return <AbookCreateForm initialData={initialData} onSubmit={handleSubmit} />
}
