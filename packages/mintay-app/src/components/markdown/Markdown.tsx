import { useMantineColorScheme } from "@mantine/core"
import MarkdownPreview from "@uiw/react-markdown-preview"

interface MarkdownProps {
	readonly source: string
}

/**
 * Markdown component with built-in theme management.
 * Automatically handles color scheme based on Mantine's color scheme.
 */
export const Markdown = ({ source }: MarkdownProps) => {
	const { colorScheme } = useMantineColorScheme()

	return (
		<MarkdownPreview
			source={source}
			wrapperElement={{
				"data-color-mode":
					colorScheme === "auto" ? "light" : colorScheme,
			}}
		/>
	)
}
