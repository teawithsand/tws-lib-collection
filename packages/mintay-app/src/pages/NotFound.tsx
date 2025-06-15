import { Button, Container, Stack, Text, Title } from "@mantine/core"
import { IconHome } from "@tabler/icons-react"
import { Link } from "react-router"

/**
 * NotFound page component displayed when user navigates to non-existent route
 */
export const NotFoundPage = () => {
	return (
		<Container size="sm" py="xl">
			<Stack
				align="center"
				gap="lg"
				style={{ minHeight: "60vh", justifyContent: "center" }}
			>
				<Stack align="center" gap="md">
					<Text
						size="8rem"
						fw={900}
						c="dimmed"
						style={{ lineHeight: 1 }}
					>
						404
					</Text>
					<Title order={2} ta="center">
						Page not found
					</Title>
					<Text c="dimmed" ta="center" size="lg">
						The page you are looking for might have been removed,
						renamed, or is temporarily unavailable.
					</Text>
				</Stack>

				<Button
					component={Link}
					to="/"
					leftSection={<IconHome size={16} />}
					variant="filled"
					size="md"
				>
					Back to Home
				</Button>
			</Stack>
		</Container>
	)
}
