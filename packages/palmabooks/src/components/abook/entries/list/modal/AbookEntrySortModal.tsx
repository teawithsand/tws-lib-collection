import { useTransResolver } from "@/app/app.hooks"
import { AbookEntryDisposition } from "@teawithsand/booklibr"
import {
	Button,
	Checkbox,
	Divider,
	Group,
	Modal,
	Radio,
	Stack,
	Text,
} from "@teawithsand/mlui"
import { useEffect, useState } from "react"
import styles from "./AbookEntrySortModal.module.scss"
import { AbookEntrySortOption } from "./abookEntrySortOption"

export interface AbookEntrySortModalProps {
	opened: boolean
	onClose: () => void
	currentOption: AbookEntrySortOption
	onOptionChange: (option: AbookEntrySortOption) => void
	selectedDispositions: Set<AbookEntryDisposition>
	onDispositionsChange: (dispositions: Set<AbookEntryDisposition>) => void
}

/**
 * Modal for selecting sort options and disposition filters.
 */
export const AbookEntrySortModal = ({
	opened,
	onClose,
	currentOption,
	onOptionChange,
	selectedDispositions,
	onDispositionsChange,
}: AbookEntrySortModalProps) => {
	const { resolve } = useTransResolver()
	const [localSortOption, setLocalSortOption] = useState(currentOption)
	const [localDispositions, setLocalDispositions] =
		useState(selectedDispositions)

	useEffect(() => {
		if (opened) {
			setLocalSortOption(currentOption)
			setLocalDispositions(new Set(selectedDispositions))
		}
	}, [opened, currentOption, selectedDispositions])

	const handleDispositionToggle = (disposition: AbookEntryDisposition) => {
		const newDispositions = new Set(localDispositions)
		if (newDispositions.has(disposition)) {
			newDispositions.delete(disposition)
		} else {
			newDispositions.add(disposition)
		}
		setLocalDispositions(newDispositions)
	}

	const handleConfirm = () => {
		onOptionChange(localSortOption)
		onDispositionsChange(localDispositions)
		onClose()
	}

	const getDispositionLabel = (
		disposition: AbookEntryDisposition,
	): string => {
		if (disposition === AbookEntryDisposition.PLAYABLE_AUDIO) {
			return resolve(
				(t) => t.abook.entries.filterModal.dispositions.playableAudio,
			)
		}
		if (disposition === AbookEntryDisposition.COVER_IMAGE) {
			return resolve(
				(t) => t.abook.entries.filterModal.dispositions.coverImage,
			)
		}
		if (disposition === AbookEntryDisposition.DESCRIPTION) {
			return resolve(
				(t) => t.abook.entries.filterModal.dispositions.description,
			)
		}
		if (disposition === AbookEntryDisposition.UNKNOWN) {
			return resolve(
				(t) => t.abook.entries.filterModal.dispositions.unknown,
			)
		}
		return disposition
	}

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={resolve((t) => t.abook.entries.filterModal.title)}
			centered
			size="sm"
			className={styles.modal}
		>
			<Stack gap="lg">
				<div>
					<Text size="sm" fw={500} mb="sm">
						{resolve(
							(t) => t.abook.entries.filterModal.sortSection,
						)}
					</Text>
					<Radio.Group
						value={localSortOption}
						onChange={(value) =>
							setLocalSortOption(value as AbookEntrySortOption)
						}
					>
						<Stack gap="xs">
							{Object.values(AbookEntrySortOption).map(
								(option) => (
									<Radio
										key={option}
										value={option}
										label={resolve((t) =>
											t.abook.entries.getSortOptionLabel(
												option,
											),
										)}
									/>
								),
							)}
						</Stack>
					</Radio.Group>
				</div>

				<Divider />

				<div>
					<Text size="sm" fw={500} mb="sm">
						{resolve(
							(t) => t.abook.entries.filterModal.filterSection,
						)}
					</Text>
					<Stack gap="xs">
						{Object.values(AbookEntryDisposition).map(
							(disposition) => (
								<Checkbox
									key={disposition}
									checked={localDispositions.has(disposition)}
									onChange={() =>
										handleDispositionToggle(disposition)
									}
									label={getDispositionLabel(disposition)}
								/>
							),
						)}
					</Stack>
				</div>

				<Group justify="flex-end" gap="sm">
					<Button variant="default" onClick={onClose}>
						{resolve(
							(t) => t.abook.entries.filterModal.cancelButton,
						)}
					</Button>
					<Button onClick={handleConfirm}>
						{resolve(
							(t) => t.abook.entries.filterModal.confirmButton,
						)}
					</Button>
				</Group>
			</Stack>
		</Modal>
	)
}
