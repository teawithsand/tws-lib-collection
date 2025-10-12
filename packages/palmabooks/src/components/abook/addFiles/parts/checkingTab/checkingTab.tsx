import { useAtomValue, useSetAtom } from "@teawithsand/fstate"
import { Button, Center, Space, Text } from "@teawithsand/mlui"
import {
	AbookAddFilesWizardTab,
	useAbookAddFileWizardBehavior,
} from "../../behavior"
import styles from "./checkingTab.module.scss"
import { FilesList } from "./filesList"

export const AbookAddFilesWizardCheckingTab = () => {
	const behavior = useAbookAddFileWizardBehavior()

	const files = useAtomValue(behavior.filesToShow)
	const isFileSetValid = useAtomValue(behavior.isFileSetValid)
	const setTab = useSetAtom(behavior.currentTab)

	return (
		<div className={styles.container}>
			<div className={styles.scrollable}>
				<Center>
					<Text size="xl">Files ({files.length})</Text>
				</Center>
				<Space h="md" />
				<div>
					<FilesList files={files} />
				</div>
			</div>

			<div className={styles.floating}>
				<Button
					fullWidth
					className={styles.floating__button}
					disabled={!isFileSetValid}
					color="green"
					onClick={() => {
						setTab(AbookAddFilesWizardTab.UPLOADING)
					}}
				>
					Continue
				</Button>
			</div>
		</div>
	)
}
