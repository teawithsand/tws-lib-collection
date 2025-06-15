import {
	Anchor,
	Button,
	Code,
	Container,
	Flex,
	Image,
	Paper,
	Stack,
	Text,
	Title,
} from "@mantine/core"
import { useState } from "react"
import styles from "../App.module.scss"
import { LocalLayout } from "../components/layout"

/**
 * Home page component displaying the main application interface
 */
export const HomePage = () => {
	const [count, setCount] = useState(0)

	return (
		<LocalLayout>
			<Container size="sm" py="xl" className={styles.container}>
				<Stack align="center" gap="lg" className={styles.stack}>
					<Flex gap="md" justify="center">
						<Anchor href="https://vite.dev" target="_blank">
							<Image
								src={""}
								alt="Vite logo"
								className={styles.logo}
							/>
						</Anchor>
						<Anchor href="https://react.dev" target="_blank">
							<Image
								src={""}
								alt="React logo"
								className={`${styles.logo} react`}
							/>
						</Anchor>
					</Flex>

					<Title>Vite + React + Mantine</Title>

					<Paper p="xl" radius="md" shadow="sm" withBorder>
						<Stack align="center">
							<Button
								onClick={() => setCount((count) => count + 1)}
								size="lg"
								variant="filled"
							>
								Count is {count}
							</Button>
							<Text>
								Edit <Code>/src/App.tsx</Code> and save to test
								HMR
							</Text>
						</Stack>
					</Paper>

					<Text c="dimmed" size="sm">
						Click on the Vite and React logos to learn more
					</Text>
				</Stack>
			</Container>
		</LocalLayout>
	)
}
