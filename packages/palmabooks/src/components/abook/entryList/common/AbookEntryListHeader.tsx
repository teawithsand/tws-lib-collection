import { useTransResolver } from "@/app/app.hooks"
import { Text, Title } from "@teawithsand/mlui"

interface AbookEntryListHeaderProps {
	readonly entryCount: number
}

export const AbookEntryListHeader = ({
	entryCount,
}: AbookEntryListHeaderProps) => {
	const { resolve } = useTransResolver()

	return (
		<>
			<Title order={2}>
				{resolve((t) => t.fileList.title(entryCount))}
			</Title>
			{entryCount === 0 && (
				<Text c="dimmed">{resolve((t) => t.fileList.empty)}</Text>
			)}
		</>
	)
}
