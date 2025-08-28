import { useTransResolver } from "@/app/app.hooks"
import { Text, Title } from "@teawithsand/mlui"

export const AboutPageContent = () => {
	const { resolve } = useTransResolver()

	return (
		<>
			<Title order={1}>{resolve((t) => t.pages.about.title)}</Title>
			<Text mt="md">{resolve((t) => t.pages.about.description)}</Text>
			<Text mt="md">{resolve((t) => t.pages.about.featuresTitle)}</Text>
			<ul>
				<li>{resolve((t) => t.pages.about.features.trackProgress)}</li>
				<li>{resolve((t) => t.pages.about.features.addNotes)}</li>
				<li>{resolve((t) => t.pages.about.features.searchFilter)}</li>
			</ul>
		</>
	)
}
