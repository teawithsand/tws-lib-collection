import { useTransResolver } from "@/app/app.hooks"
import { IconFiles, IconUpload } from "@tabler/icons-react"
import { useAtomValue, useSetAtom } from "@teawithsand/fstate"
import { Box, Stack, Tabs, Text, Title } from "@teawithsand/mlui"
import styles from "./AbookEntryUpload.module.scss"
import {
	AbookEntryUploadBehavior,
	AbookEntryUploadBehaviorContext,
	AbookEntryUploadTab,
	useAbookEntryUploadBehavior,
} from "./AbookEntryUploadBehavior"
import {
	AbookEntryUploadFilesTab,
	AbookEntryUploadSummaryTab,
} from "./tabs/index"

export interface AbookEntryUploadProps {
	readonly behavior: AbookEntryUploadBehavior
}

export const AbookEntryUpload = ({ behavior }: AbookEntryUploadProps) => {
	return (
		<AbookEntryUploadBehaviorContext.Provider value={behavior}>
			<AbookEntryUploadContent />
		</AbookEntryUploadBehaviorContext.Provider>
	)
}

const AbookEntryUploadContent = () => {
	const { resolve } = useTransResolver()
	const behavior = useAbookEntryUploadBehavior()
	const activeTab = useAtomValue(behavior.activeTab)
	const isUploading = useAtomValue(behavior.isUploading)
	const files = useAtomValue(behavior.files)
	const setActiveTab = useSetAtom(behavior.setActiveTab)

	const steps = [
		{
			tab: AbookEntryUploadTab.FILES,
			value: AbookEntryUploadTab.FILES,
			label: resolve((t) => t.abook.addFilesWizard.tabs.picking),
			icon: <IconFiles size={16} />,
		},
		{
			tab: AbookEntryUploadTab.UPLOAD,
			value: AbookEntryUploadTab.UPLOAD,
			label: resolve((t) => t.abook.addFilesWizard.tabs.uploading),
			icon: <IconUpload size={16} />,
		},
	]

	const activeTabValue = activeTab ?? steps[0].value

	return (
		<Box className={styles["abook-entry-upload__container"]}>
			<div className={styles["abook-entry-upload__steps-panel"]}>
				<Stack gap="xs">
					<Stack gap={4} align="center">
						<Title order={3} ta="center">
							{resolve((t) => t.abook.addFilesWizard.tabs.uploading)}
						</Title>
						<Text size="sm" c="dimmed" ta="center">
							{resolve((t) => t.abook.addFilesWizard.uploadTab.prompt)}
						</Text>
					</Stack>
					<Tabs
						value={activeTabValue}
						onChange={(value) => {
							if (!value) return
							if (
								value === AbookEntryUploadTab.UPLOAD &&
								files.length === 0
							) {
								return
							}
							setActiveTab(value as AbookEntryUploadTab)
						}}
						variant="default"
						color="blue"
					>
						<Tabs.List
							grow
							justify="center"
							aria-label={resolve((t) => t.abook.show.entries)}
						>
							{steps.map((step) => {
								const isDisabled =
									(isUploading && step.tab !== activeTab) ||
									(step.tab === AbookEntryUploadTab.UPLOAD &&
										files.length === 0)

								return (
									<Tabs.Tab
										key={step.value}
										value={step.value}
										disabled={isDisabled}
									>
										<div className={styles["abook-entry-upload__tab-content"]}>
											{step.icon} <span>{step.label}</span>
										</div>
									</Tabs.Tab>
								)
							})}
						</Tabs.List>
					</Tabs>
				</Stack>
			</div>

			<div className={styles["abook-entry-upload__content"]}>
				{activeTab === AbookEntryUploadTab.FILES && (
					<AbookEntryUploadFilesTab />
				)}
				{activeTab === AbookEntryUploadTab.UPLOAD && (
					<AbookEntryUploadSummaryTab filesCount={files.length} />
				)}
			</div>
		</Box>
	)
}
