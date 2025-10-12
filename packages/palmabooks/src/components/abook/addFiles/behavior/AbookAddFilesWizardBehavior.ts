import { LIB_LOGGER } from "@/internal/log"
import { AbookEntry } from "@teawithsand/booklibr"
import { atom, atomWithImmer, Draft, produce } from "@teawithsand/fstate"
import { generateUuid, naturalStringComparator } from "@teawithsand/lngext"
import { ReactContextUtil } from "@teawithsand/mlui"
import { AbookAddFilesWizardUpload } from "./upload"

export type AbookAddFilesWizardEntry = {
	file: Blob
	fileName: string
	originalFileName: string
	isEnabled: boolean
}

export type AbookAddFilesWizardDisplayEntry = AbookAddFilesWizardEntry & {
	id: string
	isNameTakenInAddSet: boolean
	isNameTakenInPreExistingSet: boolean
}

export enum AbookAddFilesWizardTab {
	PICKING = "picking",
	CHECKING = "checking",
	UPLOADING = "uploading",
}

const LOG_TAG = "AbookAddFilesWizardBehavior"

export class AbookAddFilesWizardBehavior {
	public readonly setInputFiles

	public readonly filesToShow
	public readonly filesToUpload
	public readonly currentTab
	public readonly isPickingTabEnabled
	public readonly isCheckingTabEnabled
	public readonly isUploadingTabEnabled

	public readonly isFileSetValid

	public readonly modifyFile

	public readonly alreadyExistingAbookFiles

	public readonly upload = new AbookAddFilesWizardUpload()

	constructor() {
		const innerFiles = atomWithImmer<Map<string, AbookAddFilesWizardEntry>>(
			new Map(),
		)

		this.alreadyExistingAbookFiles = atomWithImmer<AbookEntry[]>([])

		this.modifyFile = atom(
			null,
			(
				_get,
				set,
				id: string,
				mutator: (
					entry: Draft<AbookAddFilesWizardEntry>,
				) => AbookAddFilesWizardEntry | undefined,
			) => {
				set(innerFiles, (draft) => {
					const entry = draft.get(id)
					if (entry) {
						draft.set(id, produce(entry, mutator))
					} else {
						LIB_LOGGER.warn(
							LOG_TAG,
							`Can't modify file with ${id} as it was not found`,
						)
					}
				})
			},
		)

		this.setInputFiles = atom(null, (_get, set, files: File[]) => {
			const map = new Map<string, AbookAddFilesWizardEntry>()
			for (const file of files) {
				const id = generateUuid()
				map.set(id, {
					file,
					fileName: file.name,
					originalFileName: file.name,
					isEnabled: true,
				})
			}
			set(innerFiles, map)
		})

		this.filesToUpload = atom((get) =>
			[...get(innerFiles).values()].filter((f) => f.isEnabled),
		)

		this.filesToShow = atom((get): AbookAddFilesWizardDisplayEntry[] => {
			const inputFiles = get(innerFiles)
			const alreadyExistingAbookFiles = get(
				this.alreadyExistingAbookFiles,
			)

			const addSetNamesUseMap = new Map<string, number>()
			const preExistingSetNamesUseMap = new Map<string, number>()

			for (const f of inputFiles.values()) {
				const name = f.fileName
				if (f.isEnabled) {
					addSetNamesUseMap.set(
						name,
						(addSetNamesUseMap.get(name) ?? 0) + 1,
					)
				}
			}

			for (const f of alreadyExistingAbookFiles) {
				const name = f.data.name
				preExistingSetNamesUseMap.set(
					name,
					(preExistingSetNamesUseMap.get(name) ?? 0) + 1,
				)
			}

			const fileList = [...inputFiles.entries()].map(([k, file]) => ({
				...file,
				id: k,
				isNameTakenInAddSet: file.isEnabled
					? (addSetNamesUseMap.get(file.fileName) ?? 0) > 1
					: false,
				isNameTakenInPreExistingSet: file.isEnabled
					? (preExistingSetNamesUseMap.get(file.fileName) ?? 0) > 0
					: false,
			}))

			fileList.sort((a, b) =>
				naturalStringComparator.compare(
					a.originalFileName,
					b.originalFileName,
				),
			)

			return fileList
		})

		this.currentTab = atom<AbookAddFilesWizardTab>(
			AbookAddFilesWizardTab.PICKING,
		)

		this.isFileSetValid = atom((get) => {
			return get(this.filesToShow).every(
				(item) =>
					!item.isEnabled ||
					(!item.isNameTakenInAddSet &&
						!item.isNameTakenInPreExistingSet),
			)
		})
		this.isPickingTabEnabled = atom(() => true)
		this.isCheckingTabEnabled = atom((get) => get(innerFiles).size > 0)
		this.isUploadingTabEnabled = atom((get) => get(innerFiles).size > 0)
	}
}

export const [
	AbookAddFilesWizardBehaviorContext,
	useAbookAddFileWizardBehavior,
] = ReactContextUtil.simpleContext<AbookAddFilesWizardBehavior>(
	"AbookAddFilesWizardBehavior",
)
