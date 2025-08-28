import { useTransResolver } from "@/app/app.hooks"
import { Text, Title } from "@teawithsand/mlui"

export const HomePageContent = () => {
	const { resolve } = useTransResolver()

	return (
		<>
			<Title order={1}>{resolve((t) => t.pages.home.title)}</Title>
			<Text size="lg" mt="md">
				{resolve((t) => t.pages.home.subtitle)}
			</Text>
			<Text mt="md">{resolve((t) => t.pages.home.description)}</Text>
		</>
	)
}
