import { AutonomousAbookList } from "@/components/abook"
import { AppLocalLayout } from "@/components/layout"
import { Container } from "@teawithsand/mlui"

export const AbookListPage = () => {
	return (
		<AppLocalLayout>
			<Container>
				<AutonomousAbookList />
			</Container>
		</AppLocalLayout>
	)
}
