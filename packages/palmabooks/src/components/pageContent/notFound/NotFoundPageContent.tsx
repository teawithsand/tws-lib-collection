import { useTransResolver } from "@/app/app.hooks"
import { AppLocalLayout } from "@/components/layout"
import { Routes } from "@/router"
import { Button, Container, Link, Stack, Text, Title } from "@teawithsand/mlui"
import styles from "./NotFoundPageContent.module.scss"

/**
 * NotFound page content component for handling 404 errors.
 * This component includes layout and is ready to be used directly in pages.
 */
export const NotFoundPageContent = () => {
	const t = useTransResolver()
	return (
		<AppLocalLayout>
			<Container size="md" className={styles.container}>
				<Stack align="center" gap="xl">
					<Title order={1} className={styles.title}>
						{t.resolve((trans) => trans.notFoundPage.title)}
					</Title>
					<Text
						size="lg"
						c="dimmed"
						ta="center"
						className={styles.description}
					>
						{t.resolve((trans) => trans.notFoundPage.description)}
					</Text>
					<Button component={Link} to={Routes.home.navigate()}>
						{t.resolve((trans) => trans.notFoundPage.goBackToHome)}
					</Button>
				</Stack>
			</Container>
		</AppLocalLayout>
	)
}
