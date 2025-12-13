import { useTransResolver } from "@/app/app.hooks"
import { Abook, WithId } from "@teawithsand/booklibr"
import { Box, Button, Stack, Text } from "@teawithsand/mlui"
import { useMemo, useState } from "react"
import { AbookCard } from "./AbookCard"
import styles from "./AbookList.module.scss"
import { AbookListTopBar } from "./AbookListTopBar"

export interface AbookListProps {
	readonly abooks: WithId<Abook>[]
	onCreateAbookClick: () => void
	onRefresh: () => void
}

/**
 * Mobile-first audiobook list component.
 * Displays audiobooks in a simple vertical list with integrated search functionality.
 */
export const AbookList = ({
	abooks,
	onCreateAbookClick,
	onRefresh,
}: AbookListProps) => {
	const { resolve } = useTransResolver()
	const [searchQuery, setSearchQuery] = useState("")

	const filteredAbooks = useMemo(
		() =>
			searchQuery
				? abooks.filter((abook) =>
						abook.data.data.header.metadata.title
							?.toLowerCase()
							.includes(searchQuery.toLowerCase()),
					)
				: abooks,
		[abooks, searchQuery],
	)

	if (filteredAbooks.length === 0 && !searchQuery) {
		return (
			<Box className={styles.emptyState}>
				<Stack align="center" gap="md">
					<Text size="lg" c="dimmed" ta="center">
						{resolve((t) => t.abook.list.emptyState.noAudiobooks)}
					</Text>
					<Text size="sm" c="dimmed" ta="center">
						{resolve((t) => t.abook.list.emptyState.createFirst)}
					</Text>
					<Stack gap="sm" mt="md" style={{ width: "100%" }}>
						<Button
							onClick={() => {
								onCreateAbookClick()
							}}
							fullWidth
						>
							{resolve((t) => t.abook.list.createButton)}
						</Button>
						<Button
							onClick={() => {
								onRefresh()
							}}
							variant="light"
							fullWidth
						>
							{resolve((t) => t.abook.list.refreshButton)}
						</Button>
					</Stack>
				</Stack>
			</Box>
		)
	}

	return (
		<>
			<AbookListTopBar
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				onRefresh={onRefresh}
			/>
			{filteredAbooks.length === 0 ? (
				<Box className={styles.emptyState}>
					<Stack align="center" gap="md">
						<Text size="lg" c="dimmed" ta="center">
							{resolve(
								(t) => t.abook.list.emptyState.noAudiobooks,
							)}
						</Text>
					</Stack>
				</Box>
			) : (
				<Stack gap="md" className={styles.list}>
					{filteredAbooks.map((abook) => (
						<AbookCard key={abook.id} abook={abook} />
					))}
				</Stack>
			)}
		</>
	)
}
