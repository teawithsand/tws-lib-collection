import { AutonomousAbookCreate } from "@/components/abook"
import { AppLocalLayout } from "@/components/layout"
import { Container } from "@teawithsand/mlui"

export const AbookCreatePage = () => {
	return (
		<AppLocalLayout>
			<Container>
				<AutonomousAbookCreate />
			</Container>
		</AppLocalLayout>
	)
}
