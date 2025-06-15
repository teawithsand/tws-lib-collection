import { ReactNode } from "react"
import { Navbar } from "../navbar/navbar"
import styles from "./layout.module.scss"

interface LayoutProps {
	readonly children: ReactNode
}

export const GlobalLayout = ({ children }: LayoutProps) => {
	return (
		<div className={styles.layoutContainer}>
			<Navbar />
			<main className={styles.mainContent}>{children}</main>
		</div>
	)
}
