import { IconInfoCircle } from "@tabler/icons-react"
import { Alert, Container, Text, Title } from "@teawithsand/mlui"

/**
 * Autonomous abook entry list component - Not Implemented Yet.
 * This component will handle data fetching and render the appropriate list type.
 */
export const AutonomousAbookEntryList = () => {
	return (
		<Container size="md">
			<Alert
				icon={<IconInfoCircle size="1rem" />}
				title="Not Implemented Yet"
				color="blue"
				variant="light"
			>
				<Title order={3} mb="sm">
					Abook Entry List
				</Title>
				<Text>
					This component is being refactored. Please use the specific
					list components:
				</Text>
				<Text component="ul" mt="sm">
					<li>
						<strong>DispositionAbookEntryList</strong> - For
						managing file dispositions
					</li>
					<li>
						<strong>OperationAbookEntryList</strong> - For bulk
						operations
					</li>
				</Text>
			</Alert>
		</Container>
	)
}
