import { useTransResolver } from "@/app/app.hooks"
import { Button, Card, Group, Text } from "@teawithsand/mlui"
import { AbookEntryModifications } from "../../common/types"
import styles from "./DispositionSaveBar.module.scss"

interface DispositionSaveBarProps {
	readonly modificationCount: number
	readonly modifications: AbookEntryModifications
	readonly onSave?: (modifications: AbookEntryModifications) => void
	readonly onDiscard?: () => void
}

export const DispositionSaveBar = ({
	modificationCount,
	modifications,
	onSave,
	onDiscard,
}: DispositionSaveBarProps) => {
	const { resolve } = useTransResolver()
	const hasModifications = modificationCount > 0

	return (
		<Card
			withBorder
			padding="md"
			className={`${styles.saveBar} ${hasModifications ? styles.hasModifications : styles.noModifications}`}
		>
			<Group justify="space-between" align="center">
				<Text
					className={`${styles.statusText} ${hasModifications ? styles.hasModifications : styles.noModifications}`}
				>
					{hasModifications
						? resolve((t) =>
								t.entryList.disposition.hasChanges(
									modificationCount,
								),
							)
						: resolve((t) => t.entryList.disposition.noChanges)}
				</Text>
				<Group className={styles.buttonGroup}>
					<Button
						variant="subtle"
						color="gray"
						size="sm"
						onClick={onDiscard}
						disabled={!hasModifications}
					>
						{resolve((t) => t.entryList.disposition.discardChanges)}
					</Button>
					<Button
						variant="filled"
						color="blue"
						size="sm"
						onClick={() => onSave?.(modifications)}
						disabled={!hasModifications}
					>
						{resolve((t) => t.entryList.disposition.saveChanges)}
					</Button>
				</Group>
			</Group>
		</Card>
	)
}
