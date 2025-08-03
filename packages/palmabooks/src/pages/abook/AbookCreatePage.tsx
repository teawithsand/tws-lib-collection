import { AppLocalLayout } from "@/components/layout"
import { CreateAbookPageContent } from "@/components/pageContent"
import { Container } from "@teawithsand/mlui"

export const AbookCreatePage = () => {
	return (
		<AppLocalLayout>
			<Container>
				<CreateAbookPageContent />
			</Container>
		</AppLocalLayout>
	)
}
