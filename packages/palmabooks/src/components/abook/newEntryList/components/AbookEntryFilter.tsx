import { AbookEntryDisposition } from "@teawithsand/booklibr"
import { useAtomValue, useSetAtom } from "@teawithsand/fstate"
import { Text } from "@teawithsand/mlui"
import { useCallback } from "react"
import type { AbookEntryListBehavior } from "../behavior/AbookEntryListBehavior"
import styles from "./AbookEntryFilter.module.scss"

interface AbookEntryFilterProps {
	readonly behavior: AbookEntryListBehavior
}

/**
 * Filter component for filtering abook entries.
 * Provides basic name search and disposition filtering.
 */
export const AbookEntryFilter = ({ behavior }: AbookEntryFilterProps) => {
	const filter = useAtomValue(behavior.filter)
	const setFilter = useSetAtom(behavior.filter)

	const handleNameQueryChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const nameQuery = event.target.value.trim() || undefined
			setFilter({ ...filter, nameQuery })
		},
		[filter, setFilter],
	)

	const handleDispositionChange = useCallback(
		(event: React.ChangeEvent<HTMLSelectElement>) => {
			const disposition =
				event.target.value === ""
					? undefined
					: (event.target.value as AbookEntryDisposition)
			setFilter({ ...filter, disposition })
		},
		[filter, setFilter],
	)

	const handleClearFilters = useCallback(() => {
		setFilter({})
	}, [setFilter])

	const hasActiveFilters = filter.nameQuery || filter.disposition

	return (
		<div className={styles.filterContainer}>
			<div className={styles.filterRow}>
				<div className={styles.filterField}>
					<label className={styles.label} htmlFor="name-search">
						Search by name
					</label>
					<input
						id="name-search"
						type="text"
						placeholder="Enter filename to search..."
						value={filter.nameQuery || ""}
						onChange={handleNameQueryChange}
						className={styles.input}
					/>
				</div>

				<div className={styles.filterField}>
					<label
						className={styles.label}
						htmlFor="disposition-filter"
					>
						Filter by type
					</label>
					<select
						id="disposition-filter"
						value={filter.disposition || ""}
						onChange={handleDispositionChange}
						className={styles.select}
					>
						<option value="">All types</option>
						<option value={AbookEntryDisposition.PLAYABLE_AUDIO}>
							Playable Audio
						</option>
						<option value={AbookEntryDisposition.COVER_IMAGE}>
							Cover Image
						</option>
						<option value={AbookEntryDisposition.DESCRIPTION}>
							Description
						</option>
						<option value={AbookEntryDisposition.UNKNOWN}>
							Unknown
						</option>
					</select>
				</div>

				<div className={styles.actions}>
					{hasActiveFilters && (
						<button
							onClick={handleClearFilters}
							className={`${styles.button} ${styles["button--clear"]}`}
						>
							Clear Filters
						</button>
					)}
				</div>
			</div>

			<div className={styles.resultsCount}>
				<Text component="span" size="sm">
					Filter active: {hasActiveFilters ? "Yes" : "No"}
				</Text>
			</div>
		</div>
	)
}
