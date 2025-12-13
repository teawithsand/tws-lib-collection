import { useTransResolver } from "@/app/app.hooks"
import {
	IconBook,
	IconClock,
	IconEdit,
	IconList,
	IconNotes,
	IconTrash,
} from "@tabler/icons-react"
import { Abook } from "@teawithsand/booklibr"
import {
	Box,
	Button,
	Card,
	Divider,
	Group,
	MluiBreakpoint,
	Stack,
	Text,
	Title,
	useBreakpoint,
} from "@teawithsand/mlui"
import { ReactNode } from "react"
import styles from "./AbookShow.module.scss"

export interface AbookShowProps {
	readonly abook: Abook
	readonly onEdit?: () => void
	readonly onDelete?: () => void
	readonly onViewEntries?: () => void
}

const ResponsiveIconButton = ({
	onClick,
	icon,
	label,
	color,
}: {
	onClick: () => void
	icon: ReactNode
	label: string
	color?: string
}) => {
	const breakpoint = useBreakpoint()
	const isIconOnly = breakpoint.isAtMost(MluiBreakpoint.SM)

	return (
		<Button
			variant="light"
			size="sm"
			color={color}
			onClick={onClick}
			leftSection={isIconOnly ? undefined : icon}
			className={styles.editButton}
			px={isIconOnly ? "sm" : undefined}
		>
			{isIconOnly ? icon : label}
		</Button>
	)
}

/**
 * Mobile-first audiobook detail component.
 * Displays complete audiobook information in a clean, readable format.
 */
export const AbookShow = ({
	abook,
	onEdit,
	onDelete,
	onViewEntries,
}: AbookShowProps) => {
	const { resolve } = useTransResolver()

	const { data, aggregate } = abook
	const { header } = data
	const { metadata, createdAt, position } = header

	const totalDuration = aggregate.totalDurationMillis
	const hasValidDuration = totalDuration !== undefined && totalDuration >= 0

	return (
		<Box className={styles.container}>
			<Stack gap="lg">
				{/* Title Section */}
				<Card padding="lg" shadow="sm" withBorder>
					<Stack gap="md">
						<Group
							justify="space-between"
							align="flex-start"
							wrap="nowrap"
						>
							<Title order={2} className={styles.title}>
								{metadata.title ||
									resolve((t) => t.abook.show.noTitle)}
							</Title>
							<Group gap="xs">
								{onEdit && (
									<ResponsiveIconButton
										onClick={onEdit}
										icon={<IconEdit size={16} />}
										label={resolve((t) => t.common.edit)}
									/>
								)}
								{onDelete && (
									<ResponsiveIconButton
										onClick={onDelete}
										icon={<IconTrash size={16} />}
										label={resolve(
											(t) => t.abook.delete.deleteButton,
										)}
										color="red"
									/>
								)}
							</Group>
						</Group>

						<Text
							size="sm"
							c="dimmed"
							className={styles.description}
						>
							{metadata.description ||
								resolve((t) => t.abook.show.noDescription)}
						</Text>
					</Stack>
				</Card>

				<Card padding="lg" shadow="sm" withBorder>
					<Stack gap="md">
						<Group gap="xs" align="center" justify="space-between">
							<Group gap="xs" align="center">
								<IconBook size={20} />
								<Text size="sm" fw={500}>
									{resolve((t) => t.abook.show.entries)}:
								</Text>
								<Text size="sm" c="dimmed">
									{aggregate.totalEntries ?? 0}
								</Text>
							</Group>
							{onViewEntries && (
								<Button
									variant="light"
									size="xs"
									onClick={onViewEntries}
									leftSection={<IconList size={14} />}
								>
									{resolve((t) => t.abook.show.viewEntries)}
								</Button>
							)}
						</Group>

						{hasValidDuration && (
							<Group gap="xs" align="center">
								<IconClock size={20} />
								<Text size="sm" fw={500}>
									{resolve((t) => t.abook.show.duration)}:
								</Text>
								<Text size="sm" c="dimmed">
									{resolve((t) =>
										t.util.formatDuration(totalDuration),
									)}
								</Text>
							</Group>
						)}

						<Divider />

						<Group gap="xs" align="center">
							<Text size="sm" fw={500}>
								{resolve((t) => t.abook.show.created)}:
							</Text>
							<Text size="sm" c="dimmed">
								{resolve((t) =>
									t.util.formatDate(
										createdAt.toNumberMillis(),
									),
								)}
							</Text>
						</Group>

						{position && (
							<Group gap="xs" align="center">
								<Text size="sm" fw={500}>
									{resolve((t) => t.abook.show.lastPlayed)}:
								</Text>
								<Text size="sm" c="dimmed">
									{resolve((t) => t.abook.show.never)}
								</Text>
							</Group>
						)}
					</Stack>
				</Card>

				{metadata.privateUserNote && (
					<Card padding="lg" shadow="sm" withBorder>
						<Stack gap="sm">
							<Group gap="xs" align="center">
								<IconNotes size={20} />
								<Text size="sm" fw={500}>
									{resolve((t) => t.abook.show.privateNote)}
								</Text>
							</Group>
							<Text size="sm" className={styles.privateNote}>
								{metadata.privateUserNote}
							</Text>
						</Stack>
					</Card>
				)}
			</Stack>
		</Box>
	)
}
