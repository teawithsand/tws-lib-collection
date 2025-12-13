import { useTransResolver } from "@/app/app.hooks"
import { AutonomousAbookCreate } from "@/components"
import { Container, Stack, Title } from "@teawithsand/mlui"
import styles from "./AbookCreatePage.module.scss"

export const AbookCreatePage = () => {
	const { resolve } = useTransResolver()

	return (
		<Container size="md" className={styles.container}>
			<Stack gap="xl">
				<Title order={1} className={styles.title}>
					{resolve((t) => t.abook.create.pageTitle)}
				</Title>
				<AutonomousAbookCreate />
			</Stack>
		</Container>
	)
}
