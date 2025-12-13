import { useTransResolver } from "@/app/app.hooks"
import { AppLocalLayout, AutonomousAbookCreate } from "@/components"
import { Container, LoadingSuspenseBoundary, Title } from "@teawithsand/mlui"
import styles from "./AbookCreatePage.module.scss"

export const AbookCreatePage = () => {
	const { resolve } = useTransResolver()

	return (
		<AppLocalLayout>
			<LoadingSuspenseBoundary>
				<Container size="md" fullWidth pt="md">
					<Title order={1} className={styles.title}>
						{resolve((t) => t.abook.create.pageTitle)}
					</Title>
					<AutonomousAbookCreate />
				</Container>
			</LoadingSuspenseBoundary>
		</AppLocalLayout>
	)
}
