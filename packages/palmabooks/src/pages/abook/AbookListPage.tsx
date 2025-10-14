import { AutonomousAbookList } from "@/components/abook/list/AutonomousAbookList"
import { AppLocalLayout, AppLocalLayoutVariant } from "@/components/layout"
import { Container } from "@teawithsand/mlui"

export const AbookListPage = () => {
	return (
		<AppLocalLayout variant={AppLocalLayoutVariant.DEFAULT}>
			<Container>
				<AutonomousAbookList />
			</Container>
		</AppLocalLayout>
	)
}
