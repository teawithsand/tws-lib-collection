import { AppLocalLayout } from "@/components/layout"
import { Container } from "@mantine/core"
import { AutonomousAbookCreate } from "./AutonomousAbookCreate"

/**
 * Create audiobook page content component.
 * Displays a form for creating new audiobooks and handles the creation process.
 */
export const CreateAbookPageContent = () => {
	return (
		<AppLocalLayout>
			<Container>
				<AutonomousAbookCreate />
			</Container>
		</AppLocalLayout>
	)
}
