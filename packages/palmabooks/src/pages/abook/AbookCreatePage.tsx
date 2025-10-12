import { AbookAddFilesWizard } from "@/components/abook/addFiles/AbookAddFilesWizard"
import { AppLocalLayout, AppLocalLayoutVariant } from "@/components/layout"

export const AbookCreatePage = () => {
	return (
		<AppLocalLayout variant={AppLocalLayoutVariant.FULL}>
			<AbookAddFilesWizard />
		</AppLocalLayout>
	)
}
