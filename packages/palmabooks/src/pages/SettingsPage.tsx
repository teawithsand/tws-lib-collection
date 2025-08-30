import { AppLocalLayout } from "@/components/layout"
import { AutonomousSettingsPageContent } from "@/components/pageContent"
import { Container } from "@teawithsand/mlui"

export const SettingsPage = () => {
	return (
		<AppLocalLayout>
			<Container>
				<AutonomousSettingsPageContent />
			</Container>
		</AppLocalLayout>
	)
}
