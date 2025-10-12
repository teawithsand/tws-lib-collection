import { useAtomValue } from "@teawithsand/fstate"
import { useAbookAddFileWizardBehavior } from "../../behavior"

export const AbookAddFilesWizardUploadProgress = () => {
	const behavior = useAbookAddFileWizardBehavior()
	const upload = behavior.upload

	const progress = useAtomValue(upload.uploadingProgress)

	if (!progress) return <></>

	return (
		<>
			{progress.processedFiles} out of {progress.totalFiles}
			<br />
			Error: {String(progress.error || null)}
		</>
	)
}
