import { useApp, useTransResolver } from "@/app/app.hooks"
import { AdvancedFileFieldEntry } from "@/components/field/advancedFileField/AdvancedFileField"
import type { AbookStoreServiceAbookAtoms } from "@/domain/abookStore"
import { Routes } from "@/router/routes"
import {
	AbookEntryData,
	AbookEntryDisposition,
	AbookEntrySourceType,
} from "@teawithsand/booklibr"
import { useAtomValue, useSetAtom } from "@teawithsand/fstate"
import { Timestamp } from "@teawithsand/lngext"
import { useNavigation } from "@teawithsand/mlui"
import { useCallback, useState } from "react"
import { AbookUpload } from "./AbookUpload"
import { AbookUploadNotFound } from "./AbookUploadNotFound"

interface AutonomousAbookUploadProps {
	readonly abookServiceAtoms: AbookStoreServiceAbookAtoms
	readonly abookId: string
}

/**
 * Autonomous abook upload component that handles data fetching and renders appropriate content.
 */
export const AutonomousAbookUpload = ({
	abookServiceAtoms,
	abookId,
}: AutonomousAbookUploadProps) => {
	const app = useApp()
	const { resolve } = useTransResolver()
	const { navigate } = useNavigation()
	const [submitError, setSubmitError] = useState<string | null>(null)

	const abook = useAtomValue(abookServiceAtoms.data)
	const createEntry = useSetAtom(abookServiceAtoms.createEntry)
	const recomputeAggregate = useSetAtom(abookServiceAtoms.computeAggregate)

	const handleSubmit = useCallback(
		async (files: AdvancedFileFieldEntry[]) => {
			try {
				setSubmitError(null)

				for (const fileEntry of files) {
					const disposition = fileEntry.file.type.startsWith("audio/")
						? AbookEntryDisposition.PLAYABLE_AUDIO
						: AbookEntryDisposition.COVER_IMAGE

					const entryData: AbookEntryData = {
						createdAt: Timestamp.fromDate(new Date()),
						disposition,
						source: {
							type: AbookEntrySourceType.UPLOAD,
							uploadedAt: Date.now(),
							uploadFileName: fileEntry.file.name,
							uploadFileMime: fileEntry.file.type,
						},
					}

					await createEntry({
						entryData,
						blob: fileEntry.file,
					})
				}

				await recomputeAggregate()

				app.logger.info(
					"AutonomousAbookUpload",
					`Successfully uploaded ${files.length} files`,
				)

				navigate(Routes.abookShow.navigate(abookId), { replace: true })
			} catch (e) {
				app.logger.error("AutonomousAbookUpload", "Upload failed:", e)
				setSubmitError(resolve((t) => t.common.explainError(e)))
			}
		},
		[
			abookId,
			navigate,
			resolve,
			app.logger,
			createEntry,
			recomputeAggregate,
		],
	)

	const handleCancel = useCallback(() => {
		navigate(Routes.abookShow.navigate(abookId), { replace: true })
	}, [abookId, navigate])

	if (!abook) {
		return <AbookUploadNotFound />
	}

	return (
		<AbookUpload
			abook={abook}
			abookId={abookId}
			onSubmit={handleSubmit}
			onCancel={handleCancel}
			error={submitError}
		/>
	)
}
