import { useTransResolver } from "@/app/app.hooks"
import { IconRefresh, IconSearch } from "@tabler/icons-react"
import { ActionIcon, Group, TextInput } from "@teawithsand/mlui"
import styles from "./AbookListTopBar.module.scss"

export interface AbookListTopBarProps {
	searchQuery: string
	onSearchChange: (query: string) => void
	onRefresh: () => void
}

/**
 * Top bar component for audiobook list with search and refresh functionality.
 */
export const AbookListTopBar = ({
	searchQuery,
	onSearchChange,
	onRefresh,
}: AbookListTopBarProps) => {
	const { resolve } = useTransResolver()

	return (
		<Group gap="sm" className={styles.topBar}>
			<TextInput
				placeholder={resolve((t) => t.abook.list.searchPlaceholder)}
				value={searchQuery}
				onChange={(e) => onSearchChange(e.currentTarget.value)}
				leftSection={<IconSearch size={16} />}
				style={{ flex: 1 }}
			/>
			<ActionIcon
				onClick={onRefresh}
				variant="light"
				size="lg"
				aria-label={resolve((t) => t.abook.list.refreshButton)}
			>
				<IconRefresh size={18} />
			</ActionIcon>
		</Group>
	)
}
