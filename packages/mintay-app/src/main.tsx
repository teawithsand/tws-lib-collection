import { MantineProvider, createTheme } from "@mantine/core"
import "@mantine/core/styles.css"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { AppBoundary } from "./app/boundary.tsx"
import { AppProvider } from "./app/provider.tsx"
import { PWAUpdateNotification } from "./components/pwa"
import { Router } from "./router/router.tsx"

const theme = createTheme({
	// You can customize your theme here
})

// Enhanced service worker registration for PWA
const registerServiceWorker = async () => {
	if ("serviceWorker" in navigator) {
		try {
			const registration =
				await navigator.serviceWorker.register("/sw.js")
			console.log("SW registered: ", registration)

			// Check for updates
			registration.addEventListener("updatefound", () => {
				const newWorker = registration.installing
				if (newWorker) {
					newWorker.addEventListener("statechange", () => {
						if (
							newWorker.state === "installed" &&
							navigator.serviceWorker.controller
						) {
							// New version available, dispatch custom event
							window.dispatchEvent(
								new CustomEvent("sw-update-available", {
									detail: registration,
								}),
							)
						}
					})
				}
			})

			// Handle messages from service worker
			navigator.serviceWorker.addEventListener("message", (event) => {
				if (event.data && event.data.type === "SW_UPDATED") {
					window.location.reload()
				}
			})
		} catch (error) {
			console.log("SW registration failed: ", error)
		}
	}
}

// Register service worker when page loads
window.addEventListener("load", registerServiceWorker)

createRoot(document.getElementById("root")!).render(
	<AppProvider>
		<StrictMode>
			<MantineProvider theme={theme}>
				<AppBoundary>
					<Router />
					<PWAUpdateNotification />
				</AppBoundary>
			</MantineProvider>
		</StrictMode>
	</AppProvider>,
)
