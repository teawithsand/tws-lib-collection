import { useAtom } from "@teawithsand/fstate"
import { Tabs, useStableMemo } from "@teawithsand/mlui"
import styles from "./AbookAddFilesWizard.module.scss"
import {
	AbookAddFilesWizardBehavior,
	AbookAddFilesWizardBehaviorContext,
	AbookAddFilesWizardTab,
} from "./behavior"
import { AbookAddFilesWizardCheckingTab } from "./parts/checkingTab"
import { AbookAddFilesWizardNavigation } from "./parts/navigation"
import { AbookAddFilesWizardPickingTab } from "./parts/pickingTab"
import { AbookAddFilesWizardUploadingTab } from "./parts/uploadTab"

export const AbookAddFilesWizard = () => {
	const behavior = useStableMemo(() => new AbookAddFilesWizardBehavior(), [])
	const [currentTab, setCurrentTab] = useAtom(behavior.currentTab)

	return (
		<AbookAddFilesWizardBehaviorContext.Provider value={behavior}>
			<Tabs
				value={currentTab}
				onChange={(value) =>
					setCurrentTab(value as AbookAddFilesWizardTab)
				}
				className={styles.wizard}
			>
				<Tabs.Panel
					value={AbookAddFilesWizardTab.PICKING}
					className={styles["wizard__panel"]}
				>
					<div className={styles["wizard__panel-content"]}>
						<AbookAddFilesWizardPickingTab />
					</div>
				</Tabs.Panel>

				<Tabs.Panel
					value={AbookAddFilesWizardTab.CHECKING}
					className={styles["wizard__panel"]}
				>
					<div className={styles["wizard__panel-content"]}>
						<AbookAddFilesWizardCheckingTab />
					</div>
				</Tabs.Panel>

				<Tabs.Panel
					value={AbookAddFilesWizardTab.UPLOADING}
					className={styles["wizard__panel"]}
				>
					<div className={styles["wizard__panel-content"]}>
						<AbookAddFilesWizardUploadingTab />
					</div>
				</Tabs.Panel>

				<div className={styles["wizard__navigation"]}>
					<AbookAddFilesWizardNavigation />
				</div>
			</Tabs>
		</AbookAddFilesWizardBehaviorContext.Provider>
	)
}
