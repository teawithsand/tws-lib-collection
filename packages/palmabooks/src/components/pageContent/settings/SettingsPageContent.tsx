import { useTransResolver } from "@/app/app.hooks"
import { Text, Title } from "@teawithsand/mlui"

export const SettingsPageContent = () => {
	const { resolve } = useTransResolver()

	return (
		<>
			<Title order={1}>{resolve((t) => t.pages.settings.title)}</Title>
			<Text mt="md">{resolve((t) => t.pages.settings.description)}</Text>
			<Text mt="md" c="dimmed">
				{resolve((t) => t.pages.settings.underDevelopment)}
			</Text>
		</>
	)
}
