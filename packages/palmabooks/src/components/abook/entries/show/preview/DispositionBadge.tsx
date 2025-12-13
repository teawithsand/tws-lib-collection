import { useTransResolver } from "@/app/app.hooks"
import { AbookEntryDisposition } from "@teawithsand/booklibr"
import { Badge, Group, Text } from "@teawithsand/mlui"
import { getDispositionColor } from "./dispositionUtils"

export interface DispositionBadgeProps {
	readonly disposition: AbookEntryDisposition
}

export const DispositionBadge = ({ disposition }: DispositionBadgeProps) => {
	const { resolve } = useTransResolver()

	return (
		<Group gap="xs">
			<Text size="sm" fw={500}>
				{resolve((t) => t.abook.entries.preview.disposition)}:
			</Text>
			<Badge color={getDispositionColor(disposition)} variant="light">
				{resolve((t) =>
					t.abook.entries.preview.dispositions.getLabel(disposition),
				)}
			</Badge>
		</Group>
	)
}
