import { Button, Group, Stack, Text } from "@mantine/core"
import { MintayAnswer } from "@teawithsand/mintay-core"
import styles from "./CollectionLearn.module.scss"

interface CollectionLearnActionsProps {
	readonly showAnswer: boolean
	readonly isLoading: boolean
	readonly onShowAnswer: () => void
	readonly onAnswer: (answer: MintayAnswer) => void
}

/**
 * Component for handling user actions during learning session
 */
export const CollectionLearnActions = ({
	showAnswer,
	isLoading,
	onShowAnswer,
	onAnswer,
}: CollectionLearnActionsProps) => {
	if (!showAnswer) {
		return (
			<div className={styles.actions}>
				<Group justify="center">
					<Button
						onClick={onShowAnswer}
						size="lg"
						disabled={isLoading}
					>
						Show Answer
					</Button>
				</Group>
			</div>
		)
	}

	return (
		<div className={styles.actions}>
			<Stack gap="md">
				<Text ta="center" fw={500}>
					How well did you know this?
				</Text>
				<Group justify="center" className={styles.actions__buttons}>
					<Button
						onClick={() => onAnswer(MintayAnswer.AGAIN)}
						color="red"
						variant="filled"
						disabled={isLoading}
					>
						Again
					</Button>
					<Button
						onClick={() => onAnswer(MintayAnswer.HARD)}
						color="orange"
						variant="filled"
						disabled={isLoading}
					>
						Hard
					</Button>
					<Button
						onClick={() => onAnswer(MintayAnswer.GOOD)}
						color="blue"
						variant="filled"
						disabled={isLoading}
					>
						Good
					</Button>
					<Button
						onClick={() => onAnswer(MintayAnswer.EASY)}
						color="green"
						variant="filled"
						disabled={isLoading}
					>
						Easy
					</Button>
				</Group>
			</Stack>
		</div>
	)
}
