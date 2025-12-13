import { AutonomousAbookList } from "@/components"
import { Container, Stack } from "@teawithsand/mlui"

/**
 * Audiobook list page with Suspense-based loading.
 */
export const AbookListPage = () => {
	return (
		<Container size="xl" py="xl">
			<Stack gap="lg">
				<AutonomousAbookList onCreateAbookClick={() => {}} />
			</Stack>
		</Container>
	)
}
