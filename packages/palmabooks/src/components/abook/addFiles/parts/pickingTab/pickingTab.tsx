import { useTransResolver } from "@/app/app.hooks"
import { useSetAtom } from "@teawithsand/fstate"
import {
	Center,
	Dropzone,
	Space,
	Text,
	useMantineNotifications,
} from "@teawithsand/mlui"
import {
	AbookAddFilesWizardTab,
	useAbookAddFileWizardBehavior,
} from "../../behavior"
import styles from "./styles.module.scss"

export const AbookAddFilesWizardPickingTab = () => {
	const notifications = useMantineNotifications()
	const t = useTransResolver()

	const behavior = useAbookAddFileWizardBehavior()

	const setFiles = useSetAtom(behavior.setInputFiles)
	const setTab = useSetAtom(behavior.currentTab)

	return (
		<div className={styles.container}>
			<Center>
				<Text size="xl" fw="bold">
					Pick files
				</Text>
			</Center>
			<Space h="lg" />
			<Dropzone
				className={styles.dropzone}
				onDrop={(files) => {
					setFiles(files)
					setTab(AbookAddFilesWizardTab.CHECKING)
				}}
				onReject={(files) => {
					const fileCount = files.length
					notifications.show({
						title: t.resolve(
							(trans) =>
								trans.abook.addFilesWizard.notifications
									.filesRejected.title,
						),
						message: t.resolve((trans) =>
							trans.abook.addFilesWizard.notifications.filesRejected.message(
								fileCount,
							),
						),
						color: "red",
					})
				}}
			>
				<div className={styles.content}>
					<Text size="xl" fw={700}>
						Drag&Drop files here
					</Text>
					<Space h="md" />
					<Text size="sm" c="dimmed">
						Or click this box to pick files
					</Text>
				</div>
			</Dropzone>
		</div>
	)
}
