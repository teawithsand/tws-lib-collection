import { Button, Group, Notification, Portal } from "@mantine/core"
import { useEffect, useState } from "react"

/**
 * Component that displays a notification when a PWA update is available
 * and provides a button to reload the page with the new version
 */
export const PWAUpdateNotification = () => {
	const [updateAvailable, setUpdateAvailable] = useState(false)
	const [registration, setRegistration] =
		useState<ServiceWorkerRegistration | null>(null)

	useEffect(() => {
		const handleUpdateAvailable = (event: Event) => {
			const reg = (event as CustomEvent)
				.detail as ServiceWorkerRegistration
			setRegistration(reg)
			setUpdateAvailable(true)
		}

		window.addEventListener("sw-update-available", handleUpdateAvailable)

		return () => {
			window.removeEventListener(
				"sw-update-available",
				handleUpdateAvailable,
			)
		}
	}, [])

	const handleUpdate = () => {
		if (registration?.waiting) {
			registration.waiting.postMessage({ type: "SKIP_WAITING" })
		}
		window.location.reload()
	}

	const handleDismiss = () => {
		setUpdateAvailable(false)
	}

	if (!updateAvailable) {
		return null
	}

	return (
		<Portal>
			<Notification
				title="Update Available"
				onClose={handleDismiss}
				style={{
					position: "fixed",
					top: 20,
					right: 20,
					zIndex: 1000,
					maxWidth: 400,
				}}
			>
				A new version of the app is available. Reload to get the latest
				features and fixes.
				<Group mt="md" gap="sm">
					<Button size="xs" onClick={handleUpdate}>
						Update Now
					</Button>
					<Button size="xs" variant="light" onClick={handleDismiss}>
						Later
					</Button>
				</Group>
			</Notification>
		</Portal>
	)
}
