import { useTransResolver } from "@/app/app.hooks"
import { NativeSelect, Paper, Text, Title } from "@teawithsand/mlui"
import styles from "./SettingsThemeSection.module.scss"

interface SettingsThemeSectionProps {
	readonly value: "light" | "dark" | "auto"
	readonly onChange: (value: "light" | "dark" | "auto") => void
}

/**
 * Theme settings section component.
 * Allows users to select between light, dark, and auto theme modes.
 */
export const SettingsThemeSection = ({
	value,
	onChange,
}: SettingsThemeSectionProps) => {
	const { resolve } = useTransResolver()

	const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const newValue = event.target.value as "light" | "dark" | "auto"
		onChange(newValue)
	}

	return (
		<Paper className={styles.section} withBorder>
			<div className={styles.header}>
				<Title order={3} className={styles.title}>
					{resolve((t) => t.pages.settings.sections.theme.title)}
				</Title>
				<Text size="sm" c="dimmed" className={styles.description}>
					{resolve(
						(t) => t.pages.settings.sections.theme.description,
					)}
				</Text>
			</div>

			<div className={styles.content}>
				<NativeSelect
					value={value}
					onChange={handleThemeChange}
					data={[
						{
							value: "auto",
							label: resolve(
								(t) =>
									t.pages.settings.sections.theme.options
										.auto,
							),
						},
						{
							value: "light",
							label: resolve(
								(t) =>
									t.pages.settings.sections.theme.options
										.light,
							),
						},
						{
							value: "dark",
							label: resolve(
								(t) =>
									t.pages.settings.sections.theme.options
										.dark,
							),
						},
					]}
					size="md"
					className={styles.select}
				/>
			</div>
		</Paper>
	)
}
