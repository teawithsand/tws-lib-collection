import {
	Anchor,
	Card,
	Container,
	Group,
	Stack,
	Text,
	Title,
} from "@mantine/core"
import { IconBrandGithub, IconInfoCircle } from "@tabler/icons-react"
import { useTransResolver } from "../../app/trans"
import styles from "./about.module.scss"

/**
 * About component displaying application information, author, and version details
 */
export const About = () => {
	const resolver = useTransResolver()
	const appVersion = "0.0.0"
	const author = "teawithsand"
	const githubUrl = "https://github.com/teawithsand"

	return (
		<Container size="md" py="xl" className={styles.container}>
			<Stack gap="xl" align="center">
				<div className={styles.header}>
					<Group justify="center" gap="sm">
						<IconInfoCircle size={32} className={styles.icon} />
						<Title order={1} className={styles.title}>
							{resolver.resolve((t) => t.about.title())}
						</Title>
					</Group>
					<Text
						c="dimmed"
						ta="center"
						size="lg"
						className={styles.subtitle}
					>
						{resolver.resolve((t) => t.about.subtitle())}
					</Text>
				</div>

				<Card
					shadow="sm"
					padding="xl"
					radius="md"
					withBorder
					className={styles.infoCard}
				>
					<Stack gap="lg">
						<div className={styles.section}>
							<Title order={3} className={styles.sectionTitle}>
								{resolver.resolve((t) =>
									t.about.applicationInfo(),
								)}
							</Title>
							<Stack gap="sm">
								<Group justify="space-between">
									<Text fw={500}>
										{resolver.resolve((t) =>
											t.about.version(),
										)}
									</Text>
									<Text c="dimmed">{appVersion}</Text>
								</Group>
								<Group justify="space-between">
									<Text fw={500}>
										{resolver.resolve((t) =>
											t.about.license(),
										)}
									</Text>
									<Text c="dimmed">AGPL-3.0-only</Text>
								</Group>
							</Stack>
						</div>

						<div className={styles.section}>
							<Title order={3} className={styles.sectionTitle}>
								{resolver.resolve((t) => t.about.author())}
							</Title>
							<Group gap="sm">
								<Text fw={500}>{author}</Text>
								<Anchor
									href={githubUrl}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.githubLink}
								>
									<Group gap="xs">
										<IconBrandGithub size={16} />
										<Text size="sm">
											{resolver.resolve((t) =>
												t.about.github(),
											)}
										</Text>
									</Group>
								</Anchor>
							</Group>
						</div>

						<div className={styles.section}>
							<Title order={3} className={styles.sectionTitle}>
								{resolver.resolve((t) =>
									t.about.aboutTheProject(),
								)}
							</Title>
							<Text c="dimmed" className={styles.description}>
								{resolver.resolve((t) =>
									t.about.projectDescription(),
								)}
							</Text>
						</div>
					</Stack>
				</Card>
			</Stack>
		</Container>
	)
}
