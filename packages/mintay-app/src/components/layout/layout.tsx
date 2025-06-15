import { ReactNode } from "react"
import styles from "./layout.module.scss"
import { Navbar } from "./navbar"

interface LayoutProps {
	readonly children: ReactNode
}

/**
 * Base layout component that wraps all pages with navigation
 */
export const Layout = ({ children }: LayoutProps) => {
	return (
		<div className={styles.layoutContainer}>
			<Navbar />
			<main className={styles.mainContent}>{children}</main>
		</div>
	)
}
