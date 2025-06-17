import { Badge, Group, Paper } from "@mantine/core"
import { LocalLayout } from "../components/layout"

/**
 * Home page component demonstrating the customizable AppBar component
 */
export const HomePage = () => {
	return (
		<LocalLayout>
			<Paper p="md" radius="md" withBorder>
				<Group justify="center" gap="lg">
					<Badge variant="light" color="blue" size="lg">
						Demo Page
					</Badge>
					<Badge variant="light" color="green" size="lg">
						Mobile-First AppBar
					</Badge>
				</Group>
			</Paper>
		</LocalLayout>
	)
}
