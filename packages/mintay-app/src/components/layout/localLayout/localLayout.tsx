import { ReactNode } from "react"
import styles from "./localLayout.module.scss"

interface LocalLayoutProps {
	readonly children: ReactNode
}

export const LocalLayout = ({ children }: LocalLayoutProps) => {
	return <div className={styles.localLayoutContainer}>{children}</div>
}
