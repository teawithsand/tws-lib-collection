import { useApp, useTransResolver } from "@/app/app.hooks"
import { AppLocalLayout } from "@/components/layout"
import { Routes } from "@/router/routes"
import type { Abook, WithId } from "@teawithsand/booklibr"
import { useAtomValue } from "@teawithsand/fstate"
import { Container, Stack } from "@teawithsand/mlui"
import { AbooksEmptyState } from "./AbooksEmptyState"
import { AbooksList } from "./AbooksList"
import { AbooksPageHeader } from "./AbooksPageHeader"
import { useAbooksTranslations } from "./useAbooksTranslations"

/**
 * Books page content component for viewing and managing book collection.
 * This component includes layout and is ready to be used directly in pages.
 */
export const AbooksPageContent = () => {
	const app = useApp()
	const { resolve } = useTransResolver()
	const abooks = useAtomValue(app.abookStoreService.abooksList)

	const { translations, formatDuration, formatEntryCount, getSubtitle } =
		useAbooksTranslations(resolve, abooks.length)

	const handleAbookClick = (abook: WithId<Abook>) => {
		// TODO: Implement audiobook navigation
		console.log("Audiobook clicked:", abook.id)
	}

	const renderContent = () => {
		if (abooks.length === 0) {
			return (
				<AbooksEmptyState
					title={translations.emptyTitle}
					description={translations.emptyDescription}
					createButtonLabel={translations.createButton}
					createButtonTo={Routes.addBook.navigate()}
				/>
			)
		}

		return (
			<AbooksList
				abooks={abooks}
				formatEntryCount={formatEntryCount}
				formatDuration={formatDuration}
				onAbookClick={handleAbookClick}
			/>
		)
	}

	return (
		<AppLocalLayout>
			<Container>
				<Stack gap="lg">
					<AbooksPageHeader
						title={translations.pageTitle}
						subtitle={getSubtitle(abooks.length)}
						addButtonLabel={translations.addButton}
						addButtonTo={Routes.addBook.navigate()}
					/>
					{renderContent()}
				</Stack>
			</Container>
		</AppLocalLayout>
	)
}
