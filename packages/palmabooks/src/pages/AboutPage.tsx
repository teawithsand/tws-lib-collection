import { AppLocalLayout } from "@/components/layout"
import { AboutPageContent } from "@/components/pageContent"
import { Container } from "@teawithsand/mlui"

export const AboutPage = () => {
	return (
		<AppLocalLayout>
			<Container>
				<AboutPageContent />
			</Container>
		</AppLocalLayout>
	)
}
