import { useTransResolver } from "@/app/app.hooks"
import { Routes } from "@/router/routes"
import {
	Button,
	Container,
	Stack,
	Text,
	Title,
	useNavigation,
} from "@teawithsand/mlui"
import styles from "./abookUploadNotFound.module.scss"

/**
 * Component shown when an audiobook for upload is not found.
 */
export const AbookUploadNotFound = () => {
	const { resolve } = useTransResolver()
	const { navigate } = useNavigation()

	const handleGoBack = () => {
		navigate(Routes.books.navigate())
	}

	return (
		<Container size="sm" className={styles["abook-upload-not-found"]}>
			<Stack align="center" gap="xl">
				<div className={styles["abook-upload-not-found__content"]}>
					<Title
						order={1}
						ta="center"
						className={styles["abook-upload-not-found__title"]}
					>
						{resolve((t) => t.abooks.notFound.title)}
					</Title>
					<Text
						ta="center"
						c="dimmed"
						className={
							styles["abook-upload-not-found__description"]
						}
					>
						{resolve((t) => t.abooks.notFound.description)}
					</Text>
				</div>

				<Button onClick={handleGoBack} variant="outline">
					{resolve((t) => t.abooks.notFound.goBackButton)}
				</Button>
			</Stack>
		</Container>
	)
}
