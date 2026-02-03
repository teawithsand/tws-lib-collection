import { useAtomValue, useSetAtom } from "@teawithsand/fstate"
import { useEffect } from "react"
import { useAbookEntryListBehavior } from "./AbookEntryListBehavior"

const isEditableTarget = (target: EventTarget | null): boolean => {
	if (!(target instanceof HTMLElement)) return false

	const tagName = target.tagName
	if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
		return true
	}

	return target.isContentEditable
}

/**
 * Keyboard shortcut handler for list selection.
 * - Ctrl+A: select all shown entries
 * - Ctrl+Shift+A: clear selection
 */
export const AbookEntrySelectionShortcuts = () => {
	const behavior = useAbookEntryListBehavior()
	const entriesLoadable = useAtomValue(behavior.shownEntriesLoadable)
	const setEntrySelection = useSetAtom(behavior.setEntrySelection)
	const clearSelection = useSetAtom(behavior.clearSelection)

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const isCtrlOrMeta = event.ctrlKey || event.metaKey
			if (!isCtrlOrMeta) return

			if (event.key.toLowerCase() !== "a") return
			if (isEditableTarget(event.target)) return

			event.preventDefault()

			if (event.shiftKey) {
				clearSelection()
				return
			}

			if (entriesLoadable.state !== "hasData") return

			entriesLoadable.data.forEach((entry) => {
				setEntrySelection(entry, true)
			})
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [clearSelection, entriesLoadable, setEntrySelection])

	return null
}
