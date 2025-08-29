import { useTransResolver } from "@/app/app.hooks"
import { Stack, Title } from "@teawithsand/mlui"
import {
	StorageActionsSection,
	StoragePersistenceSection,
	StorageQuotaSection,
} from "./parts"

interface StoragePageContentProps {
	readonly storageEstimate: {
		quota: number
		usage: number
	}
	readonly isStoragePersisted: boolean
	readonly onRefreshStorage: () => void
	readonly onRefreshPage: () => void
	readonly onRequestPersistence: () => Promise<void>
}

/**
 * Non-autonomous storage page content component.
 * Displays storage information and persistence controls based on provided props.
 * Suitable for Storybook, testing, and scenarios where parent manages state.
 */
export const StoragePageContent = ({
	storageEstimate,
	isStoragePersisted,
	onRefreshStorage,
	onRefreshPage,
	onRequestPersistence,
}: StoragePageContentProps) => {
	const { resolve } = useTransResolver()

	return (
		<Stack gap="lg">
			<Title order={1}>{resolve((t) => t.storage.pageTitle)}</Title>

			<StorageQuotaSection storageEstimate={storageEstimate} />

			<StoragePersistenceSection
				isStoragePersisted={isStoragePersisted}
				onRefreshPage={onRefreshPage}
				onRequestPersistence={onRequestPersistence}
			/>

			<StorageActionsSection onRefreshStorage={onRefreshStorage} />
		</Stack>
	)
}
