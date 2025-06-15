import {
	ActionIcon,
	Burger,
	Container,
	Group,
	Text,
	useMantineColorScheme,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import {
	IconBook,
	IconCards,
	IconHome,
	IconMoon,
	IconSun,
} from "@tabler/icons-react"
import { Link, useLocation } from "react-router"
import styles from "./navbar.module.scss"

interface NavLink {
	readonly label: string
	readonly href: string
	readonly icon: React.ComponentType<{ size?: number }>
}

const NAV_LINKS: NavLink[] = [
	{ label: "Home", href: "/", icon: IconHome },
	{ label: "Collections", href: "/collections", icon: IconBook },
	{ label: "Cards", href: "/cards", icon: IconCards },
]

/**
 * Navigation bar component with responsive design and theme toggle
 */
export const Navbar = () => {
	const [opened, { toggle, close }] = useDisclosure(false)
	const { colorScheme, toggleColorScheme } = useMantineColorScheme()
	const location = useLocation()

	const isActiveRoute = (href: string): boolean => {
		if (href === "/") {
			return location.pathname === "/"
		}
		return location.pathname.startsWith(href)
	}

	const renderNavLinks = () =>
		NAV_LINKS.map(({ label, href, icon: Icon }) => (
			<Link
				key={href}
				to={href}
				className={`${styles.navLink} ${
					isActiveRoute(href) ? styles.navLinkActive : ""
				}`}
				onClick={close}
			>
				<Icon size={16} />
				<span>{label}</span>
			</Link>
		))

	return (
		<header className={styles.header}>
			<Container size="xl" className={styles.inner}>
				<Group justify="space-between" h="100%">
					{/* Logo/Brand */}
					<Link to="/" className={styles.brand}>
						<IconCards size={24} />
						<Text size="lg" fw={700} className={styles.brandText}>
							Mintay
						</Text>
					</Link>

					{/* Desktop Navigation */}
					<Group gap="xs" className={styles.desktopNav}>
						{renderNavLinks()}
					</Group>

					{/* Actions */}
					<Group gap="xs">
						<ActionIcon
							onClick={() => toggleColorScheme()}
							variant="subtle"
							size="lg"
							aria-label="Toggle color scheme"
						>
							{colorScheme === "dark" ? (
								<IconSun size={18} />
							) : (
								<IconMoon size={18} />
							)}
						</ActionIcon>

						<Burger
							opened={opened}
							onClick={toggle}
							size="sm"
							className={styles.burger}
							aria-label="Toggle navigation"
						/>
					</Group>
				</Group>

				{/* Mobile Navigation */}
				{opened && (
					<div className={styles.mobileNav}>
						<nav className={styles.mobileNavContent}>
							{renderNavLinks()}
						</nav>
					</div>
				)}
			</Container>
		</header>
	)
}
