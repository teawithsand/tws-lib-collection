import { AppLocalLayout } from "@/components/layout"
import { NotFoundPageContent } from "@/components/pageContent"
import { Container } from "@teawithsand/mlui"
import styles from "./NotFoundPage.module.scss"

export const NotFoundPage = () => {
	return (
		<AppLocalLayout>
			<Container size="md" className={styles.container}>
				<NotFoundPageContent />
			</Container>
		</AppLocalLayout>
	)
}
