import { AppLocalLayout } from "@/components/layout"
import { StoragePageContent } from "@/components/pageContent"
import { Container } from "@teawithsand/mlui"

export const StoragePage = () => {
	return (
		<AppLocalLayout>
			<Container>
				<StoragePageContent />
			</Container>
		</AppLocalLayout>
	)
}
