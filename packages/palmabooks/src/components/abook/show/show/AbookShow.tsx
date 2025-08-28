import { useTransResolver } from "@/app/app.hooks"
import type { Abook, AbookEntry, WithId } from "@teawithsand/booklibr"
import styles from "../AbookShow.module.scss"
import { AbookEntriesSection } from "./AbookEntriesSection"
import { AbookHeroSection } from "./AbookHeroSection"
import { AbookMetadataAside } from "./AbookMetadataAside"

interface AbookShowProps {
	readonly abook: Abook
	readonly abookEntries: Array<WithId<AbookEntry>>
	readonly abookId: string
}

export const AbookShow = ({ abook, abookEntries, abookId }: AbookShowProps) => {
	const { resolve } = useTransResolver()

	const formatDuration = (milliseconds: number): string => {
		return resolve((t) => t.util.time.formatDuration(milliseconds))
	}

	const formatDate = (timestamp: number): string => {
		return resolve((t) => t.util.time.formatDate(timestamp))
	}

	return (
		<div className={styles.container}>
			<AbookHeroSection abook={abook} formatDuration={formatDuration} />

			<div className={styles.contentGrid}>
				<AbookEntriesSection
					abookEntries={abookEntries}
					formatDuration={formatDuration}
				/>

				<AbookMetadataAside
					abook={abook}
					abookId={abookId}
					formatDuration={formatDuration}
					formatDate={formatDate}
				/>
			</div>
		</div>
	)
}
