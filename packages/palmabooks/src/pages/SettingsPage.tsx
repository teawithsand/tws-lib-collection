import { AppLocalLayout } from "@/components/layout"
import { SettingsPageContent } from "@/components/pageContent"
import { Container } from "@teawithsand/mlui"

export const SettingsPage = () => {
	return (
		<AppLocalLayout>
			<Container>
				<SettingsPageContent />
			</Container>
		</AppLocalLayout>
	)
}
