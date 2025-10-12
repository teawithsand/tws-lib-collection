import { useTransResolver } from "@/app/app.hooks"
import {
	IconChecklist,
	IconCloudUpload,
	IconFolderPlus,
} from "@tabler/icons-react"
import { useAtom } from "@teawithsand/fstate"
import { Tabs } from "@teawithsand/mlui"
import { useContext } from "react"
import {
	AbookAddFilesWizardBehaviorContext,
	AbookAddFilesWizardTab,
} from "../../behavior"
import styles from "./AbookAddFilesWizardNavigation.module.scss"

export const AbookAddFilesWizardNavigation = () => {
	const behavior = useContext(AbookAddFilesWizardBehaviorContext)
	if (!behavior) {
		throw new Error(
			"AbookAddFilesWizardNavigation must be used within AbookAddFilesWizardBehaviorContext",
		)
	}

	const [isPickingEnabled] = useAtom(behavior.isPickingTabEnabled)
	const [isCheckingEnabled] = useAtom(behavior.isCheckingTabEnabled)
	const [isUploadingEnabled] = useAtom(behavior.isUploadingTabEnabled)
	const { resolve } = useTransResolver()
	const pickingTabLabel = resolve(
		(trans) => trans.abook.addFilesWizard.tabs.picking,
	)
	const checkingTabLabel = resolve(
		(trans) => trans.abook.addFilesWizard.tabs.checking,
	)
	const uploadingTabLabel = resolve(
		(trans) => trans.abook.addFilesWizard.tabs.uploading,
	)
	const tabIconStrokeWidth = 1.75
	const tabIconSize = 24

	return (
		<div className={styles.navigation}>
			<Tabs.List grow className={styles["navigation__tab-list"]}>
				<Tabs.Tab
					className={styles["navigation__tab"]}
					value={AbookAddFilesWizardTab.PICKING}
					disabled={!isPickingEnabled}
				>
					<div className={styles["navigation__tab-content"]}>
						<IconFolderPlus
							className={styles["navigation__tab-icon"]}
							stroke={tabIconStrokeWidth}
							size={tabIconSize}
							aria-hidden="true"
						/>
						<span className={styles["navigation__tab-label"]}>
							{pickingTabLabel}
						</span>
					</div>
				</Tabs.Tab>
				<Tabs.Tab
					className={styles["navigation__tab"]}
					value={AbookAddFilesWizardTab.CHECKING}
					disabled={!isCheckingEnabled}
				>
					<div className={styles["navigation__tab-content"]}>
						<IconChecklist
							className={styles["navigation__tab-icon"]}
							stroke={tabIconStrokeWidth}
							size={tabIconSize}
							aria-hidden="true"
						/>
						<span className={styles["navigation__tab-label"]}>
							{checkingTabLabel}
						</span>
					</div>
				</Tabs.Tab>
				<Tabs.Tab
					className={styles["navigation__tab"]}
					value={AbookAddFilesWizardTab.UPLOADING}
					disabled={!isUploadingEnabled}
				>
					<div className={styles["navigation__tab-content"]}>
						<IconCloudUpload
							className={styles["navigation__tab-icon"]}
							stroke={tabIconStrokeWidth}
							size={tabIconSize}
							aria-hidden="true"
						/>
						<span className={styles["navigation__tab-label"]}>
							{uploadingTabLabel}
						</span>
					</div>
				</Tabs.Tab>
			</Tabs.List>
		</div>
	)
}
