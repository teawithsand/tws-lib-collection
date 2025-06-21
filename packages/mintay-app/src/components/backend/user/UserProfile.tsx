import { User } from "@/domain/backend/client"
import { Routes } from "@/router/routes"
import { Button, Card, Group, Stack, Text, Title } from "@mantine/core"
import { Link } from "react-router"
import styles from "./UserProfile.module.scss"

interface UserProfileProps {
	readonly user: User
	readonly onLogout: () => void
}

/**
 * Component that displays user profile information
 */
export const UserProfile = ({ user, onLogout }: UserProfileProps) => {
	const formatDate = (dateString: string): string => {
		return new Date(dateString).toLocaleDateString()
	}

	return (
		<div className={styles["user-profile__container"]}>
			<Card shadow="sm" padding="lg" radius="md" withBorder>
				<Stack gap="md">
					<Title order={2} className={styles["user-profile__title"]}>
						User Profile
					</Title>

					<Stack gap="xs">
						<Group justify="space-between">
							<Text fw={500}>Username:</Text>
							<Text>{user.username}</Text>
						</Group>

						<Group justify="space-between">
							<Text fw={500}>User ID:</Text>
							<Text c="dimmed" size="sm">
								{user.id}
							</Text>
						</Group>

						<Group justify="space-between">
							<Text fw={500}>Member Since:</Text>
							<Text>{formatDate(user.createdAt)}</Text>
						</Group>
					</Stack>

					<Group justify="space-between" mt="md">
						<Button
							component={Link}
							to={Routes.collections.navigate()}
							variant="light"
						>
							View Collections
						</Button>

						<Button
							onClick={onLogout}
							color="red"
							variant="outline"
						>
							Logout
						</Button>
					</Group>
				</Stack>
			</Card>
		</div>
	)
}
