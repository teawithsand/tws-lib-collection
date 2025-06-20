import { Routes } from "@/router/routes"
import { Button, Card, Group, Stack, Text, Title } from "@mantine/core"
import { Link } from "react-router"
import styles from "./LoginRequired.module.scss"

/**
 * Component that displays a login required message
 */
export const LoginRequired = () => {
	return (
		<div className={styles["login-required__container"]}>
			<Card shadow="sm" padding="lg" radius="md" withBorder>
				<Stack gap="md" align="center">
					<Title
						order={2}
						className={styles["login-required__title"]}
					>
						Authentication Required
					</Title>

					<Text ta="center" c="dimmed">
						You need to be logged in to view your profile
						information.
					</Text>

					<Group gap="md" mt="md">
						<Button
							component={Link}
							to={Routes.login.navigate()}
							variant="filled"
						>
							Login
						</Button>

						<Button
							component={Link}
							to={Routes.register.navigate()}
							variant="light"
						>
							Register
						</Button>
					</Group>
				</Stack>
			</Card>
		</div>
	)
}
