import { useTransResolver } from "@/app/app.hooks"
import { useMemo } from "react"

export interface AbooksTranslations {
	pageTitle: string
	emptyTitle: string
	emptyDescription: string
	createButton: string
	addButton: string
}

export interface AbooksTranslationsHookResult {
	translations: AbooksTranslations
	formatDuration: (durationMillis: number) => string
	formatEntryCount: (count: number) => string
	formatCountText: (count: number) => string
	getSubtitle: (abooksCount: number) => string
}

/**
 * Hook for managing audiobooks translations and formatting functions.
 */
export const useAbooksTranslations = (
	abooksCount: number,
): AbooksTranslationsHookResult => {
	const { resolve } = useTransResolver()
	const translations = useMemo(
		(): AbooksTranslations => ({
			pageTitle: resolve((t) => t.abooks.pageTitle),
			emptyTitle: resolve((t) => t.abooks.list.emptyState.title),
			emptyDescription: resolve(
				(t) => t.abooks.list.emptyState.description,
			),
			createButton: resolve((t) => t.abooks.list.emptyState.createButton),
			addButton: resolve((t) => t.abooks.list.addButton),
		}),
		[resolve],
	)

	const formatDuration = useMemo(
		() =>
			(durationMillis: number): string => {
				return resolve((t) =>
					t.util.time.formatDuration(durationMillis),
				)
			},
		[resolve],
	)

	const formatEntryCount = useMemo(
		() =>
			(count: number): string => {
				return resolve((t) => t.abooks.list.entryCountText(count))
			},
		[resolve],
	)

	const formatCountText = useMemo(
		() =>
			(count: number): string => {
				return resolve((t) => t.abooks.list.countText(count))
			},
		[resolve],
	)

	const getSubtitle = useMemo(
		() =>
			(count: number): string => {
				return resolve((t) => t.abooks.list.countText(count))
			},
		[resolve],
	)

	return {
		translations,
		formatDuration,
		formatEntryCount,
		formatCountText,
		getSubtitle: () => getSubtitle(abooksCount),
	}
}
