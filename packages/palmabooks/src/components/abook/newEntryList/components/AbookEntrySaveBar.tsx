import { useAtomValue, useSetAtom } from "@teawithsand/fstate"
import { Text } from "@teawithsand/mlui"
import { useCallback, useState } from "react"
import type { AbookEntryListBehavior } from "../behavior/AbookEntryListBehavior"
import styles from "./AbookEntrySaveBar.module.scss"

interface AbookEntrySaveBarProps {
	readonly behavior: AbookEntryListBehavior
	readonly onSaveChanges: () => Promise<void>
}

/**
 * Save bar component for displaying modification status and actions.
 * Uses CSS modules for styling and provides loading state support.
 */
export const AbookEntrySaveBar = ({
	behavior,
	onSaveChanges,
}: AbookEntrySaveBarProps) => {
	const isPristine = useAtomValue(behavior.isPristine)
	const clearModifications = useSetAtom(behavior.clear)
	const [isLoading, setIsLoading] = useState(false)

	const handleSave = useCallback(async () => {
		setIsLoading(true)
		try {
			await onSaveChanges()
		} finally {
			setIsLoading(false)
		}
	}, [onSaveChanges])

	const handleClear = useCallback(() => {
		clearModifications()
	}, [clearModifications])

	if (isPristine) {
		return null
	}

	return (
		<div className={styles.saveBar}>
			<div className={styles.message}>
				<Text component="span" size="sm">
					You have unsaved changes
				</Text>
			</div>

			<div className={styles.actions}>
				<button
					onClick={handleSave}
					disabled={isLoading}
					className={`${styles.button} ${styles["button--primary"]}`}
				>
					{isLoading ? "Saving..." : "Save Changes"}
				</button>

				<button
					onClick={handleClear}
					disabled={isLoading}
					className={`${styles.button} ${styles["button--secondary"]}`}
				>
					Discard
				</button>
			</div>
		</div>
	)
}
