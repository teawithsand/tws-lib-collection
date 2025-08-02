import type { AppTranslation } from "@/trans/appTranslation"
import { useMemo } from "react"

export interface AbooksTranslations {
	pageTitle: string
	emptyTitle: string
	emptyDescription: string
	createButton: string
	addButton: string
	countSingular: string
	countPlural: string
	fallbackSubtitle: string
	entrySingular: string
	entryPlural: string
	unknownDuration: string
	minutesLabel: string
}

export interface AbooksTranslationsHookResult {
	translations: AbooksTranslations
	formatDuration: (durationMillis: number) => string
	formatEntryCount: (count: number) => string
	getSubtitle: (abooksCount: number) => string
}

/**
 * Hook for managing audiobooks translations and formatting functions.
 */
export const useAbooksTranslations = (
	resolve: (selector: (t: AppTranslation) => string) => string,
	abooksCount: number,
): AbooksTranslationsHookResult => {
	const translations = useMemo(
		(): AbooksTranslations => ({
			pageTitle: resolve((t) => t.audiobooks.pageTitle),
			emptyTitle: resolve((t) => t.audiobooks.emptyState.title),
			emptyDescription: resolve(
				(t) => t.audiobooks.emptyState.description,
			),
			createButton: resolve((t) => t.audiobooks.emptyState.createButton),
			addButton: resolve((t) => t.audiobooks.list.addButton),
			countSingular: resolve((t) => t.audiobooks.list.countSingular),
			countPlural: resolve((t) => t.audiobooks.list.countPlural),
			fallbackSubtitle: resolve(
				(t) => t.audiobooks.list.fallbackSubtitle,
			),
			entrySingular: resolve(
				(t) => t.audiobooks.list.entryCount.singular,
			),
			entryPlural: resolve((t) => t.audiobooks.list.entryCount.plural),
			unknownDuration: resolve((t) => t.audiobooks.list.duration.unknown),
			minutesLabel: resolve((t) => t.audiobooks.list.duration.minutes),
		}),
		[resolve],
	)

	const formatDuration = useMemo(
		() =>
			(durationMillis: number): string => {
				if (durationMillis <= 0) return translations.unknownDuration
				const minutes = Math.round(durationMillis / 1000 / 60)
				return `${minutes} ${translations.minutesLabel}`
			},
		[translations.unknownDuration, translations.minutesLabel],
	)

	const formatEntryCount = useMemo(
		() =>
			(count: number): string => {
				return `${count} ${count === 1 ? translations.entrySingular : translations.entryPlural}`
			},
		[translations.entrySingular, translations.entryPlural],
	)

	const getSubtitle = useMemo(
		() =>
			(count: number): string => {
				if (count === 0) return translations.fallbackSubtitle
				const countLabel =
					count === 1
						? translations.countSingular
						: translations.countPlural
				return `${count} ${countLabel}`
			},
		[
			translations.fallbackSubtitle,
			translations.countSingular,
			translations.countPlural,
		],
	)

	return {
		translations,
		formatDuration,
		formatEntryCount,
		getSubtitle: () => getSubtitle(abooksCount),
	}
}
