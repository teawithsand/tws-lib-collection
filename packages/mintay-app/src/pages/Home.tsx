import { Button, Container, Group, Text, Title } from "@mantine/core"
import { Link } from "react-router"
import { LocalLayout } from "../components/layout"
import { Routes } from "../router/routes"

/**
 * Home page for Mintay: SRS app powered by mintay-core
 * Explains Mintay and mintay-core to the user
 */
export const HomePage = () => {
	return (
		<LocalLayout>
			<Container size="sm" px="md" mt="xl">
				<Group justify="center" mb="lg">
					<Title order={1} c="blue.7" ta="center">
						Welcome to Mintay
					</Title>
				</Group>
				<Text size="lg" ta="center" mb="md">
					<strong>Mintay</strong> is a modern, mobile-first Spaced
					Repetition System (SRS) web application designed to help you
					learn and remember efficiently.
				</Text>
				<Text size="md" ta="center" mb="md">
					It is powered by <strong>mintay-core</strong>, a TypeScript
					library providing the core SRS engine and logic for optimal
					memory retention using spaced repetition techniques.
				</Text>
				<ul
					style={{ maxWidth: 500, margin: "0 auto", paddingLeft: 24 }}
				>
					<li>
						<Text>
							🧠 Scientifically-backed spaced repetition
							algorithms
						</Text>
					</li>
					<li>
						<Text>📱 Mobile-first, responsive design</Text>
					</li>
					<li>
						<Text>🎨 Customizable UI with Mantine</Text>
					</li>
					<li>
						<Text>🔗 Open-source and extensible</Text>
					</li>
					<li>
						<Text>🚀 Built for speed and usability</Text>
					</li>
				</ul>
				<Group justify="center" mt="xl">
					<Button
						component={Link}
						to={Routes.collections.navigate()}
						size="lg"
						color="blue"
						radius="md"
					>
						View Collections
					</Button>
				</Group>
			</Container>
		</LocalLayout>
	)
}
