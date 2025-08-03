import { AppLocalLayout } from "@/components/layout"
import { CategoriesPageContent } from "@/components/pageContent"
import { Container } from "@teawithsand/mlui"

export const CategoriesPage = () => {
	return (
		<AppLocalLayout>
			<Container>
				<CategoriesPageContent />
			</Container>
		</AppLocalLayout>
	)
}
