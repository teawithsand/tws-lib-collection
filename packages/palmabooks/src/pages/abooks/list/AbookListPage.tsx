import { AutonomousAbookList } from "@/components"
import { Container, Stack } from "@teawithsand/mlui"
import styles from "./AbookListPage.module.scss"

/**
 * Audiobook list page with Suspense-based loading.
 */
export const AbookListPage = () => {
	return (
		<Container size="xl" py="xl" className={styles.container}>
			<Stack gap="lg">
				<AutonomousAbookList />
			</Stack>
		</Container>
	)
}
