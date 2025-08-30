import { useTransResolver } from "@/app/app.hooks"
import { Text, Title } from "@teawithsand/mlui"
import { SettingsThemeSection } from "./parts"
import styles from "./SettingsPageContent.module.scss"

interface SettingsPageContentProps {
	readonly theme: "light" | "dark" | "auto"
	readonly onThemeChange: (theme: "light" | "dark" | "auto") => void
}

/**
 * Non-autonomous settings page content component.
 * Displays settings interface based on provided props.
 * Suitable for Storybook, testing, and scenarios where parent manages state.
 */
export const SettingsPageContent = ({
	theme,
	onThemeChange,
}: SettingsPageContentProps) => {
	const { resolve } = useTransResolver()

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<Title order={1} className={styles.title}>
					{resolve((t) => t.pages.settings.title)}
				</Title>
				<Text className={styles.description}>
					{resolve((t) => t.pages.settings.description)}
				</Text>
			</div>

			<div className={styles.sections}>
				<SettingsThemeSection value={theme} onChange={onThemeChange} />
			</div>
		</div>
	)
}
