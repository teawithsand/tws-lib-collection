import { useApp } from "@/app"
import { Alert, Button, Container, Loader, Text } from "@mantine/core"
import { IconAlertCircle } from "@tabler/icons-react"
import { useAtomValue } from "@teawithsand/fstate"
import { CollectionList } from "./collectionList"
import styles from "./collectionList.module.scss"
import { CollectionListHeader } from "./collectionListHeader"
import { EmptyCollectionsState } from "./emptyCollectionsState"

/**
 * Loading state component for collections
 */
const CollectionsLoadingState = () => (
	<div className={styles.loadingContainer}>
		<Loader size="lg" />
		<Text mt="md" c="dimmed">
			Loading collections...
		</Text>
	</div>
)

/**
 * Error state component for collections
 */
const CollectionsErrorState = () => (
	<Alert
		icon={<IconAlertCircle size={16} />}
		title="Error loading collections"
		color="red"
		className={styles.errorAlert}
	>
		<Text size="sm">
			Failed to load collections. Please try refreshing.
		</Text>
		<Button
			variant="outline"
			size="xs"
			mt="sm"
			onClick={() => window.location.reload()}
		>
			Retry
		</Button>
	</Alert>
)

/**
 * Autonomous collection list component that manages its own data fetching and state
 */
export const AutonomousCollectionList = () => {
	const app = useApp()
	const collectionsLoadable = useAtomValue(
		app.collectionService.collectionDataListLoadable,
	)

	const renderContent = () => {
		if (collectionsLoadable.state === "loading") {
			return <CollectionsLoadingState />
		}

		if (collectionsLoadable.state === "hasError") {
			return <CollectionsErrorState />
		}

		const collections = collectionsLoadable.data

		if (!collections || collections.length === 0) {
			return <EmptyCollectionsState />
		}

		return <CollectionList collections={collections} />
	}

	return (
		<Container size="xl" className={styles.container}>
			<CollectionListHeader
				isLoading={collectionsLoadable.state === "loading"}
				collectionsCount={
					collectionsLoadable.state === "hasData"
						? collectionsLoadable.data?.length
						: undefined
				}
			/>

			<div className={styles.content}>{renderContent()}</div>
		</Container>
	)
}
