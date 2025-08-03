import { useTransResolver } from "@/app/app.hooks"
import { Routes } from "@/router"
import { Button, Link, Stack, Text, Title } from "@teawithsand/mlui"
import styles from "./NotFoundPageContent.module.scss"

/**
 * NotFound page content component for handling 404 errors.
 */
export const NotFoundPageContent = () => {
	const t = useTransResolver()
	return (
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
	)
}
