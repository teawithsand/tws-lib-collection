import { AppLocalLayout } from "@/components/layout"
import { AutonomousStoragePageContent } from "@/components/pageContent"
import { Container } from "@teawithsand/mlui"

export const StoragePage = () => {
	return (
		<AppLocalLayout>
			<Container>
				<AutonomousStoragePageContent />
			</Container>
		</AppLocalLayout>
	)
}
