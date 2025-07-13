import { atom, AtomUtil, DefaultStickyEventBus } from "@teawithsand/fstate"
import { MLUI_LOGGER } from "../../internal/log"

const Logger = MLUI_LOGGER.createTaggedLogger("SwService")

/**
 * Service for managing Progressive Web App (PWA) functionality including
 * service worker registration, update notifications, and state management.
 *
 * Uses reactive atoms to manage registration state and update availability.
 */
export class SwService {
	private readonly registrationBus =
		new DefaultStickyEventBus<ServiceWorkerRegistration | null>(null)
	private readonly updateAvailableBus = new DefaultStickyEventBus<boolean>(
		false,
	)

	private readonly _registrationAtom = AtomUtil.stickySubscribableAtom(
		this.registrationBus,
	)
	private readonly _updateAvailableAtom = AtomUtil.stickySubscribableAtom(
		this.updateAvailableBus,
	)

	private constructor() {}

	/**
	 * Gets the current service worker registration atom.
	 * Returns an atom containing the registration or null if not available.
	 */
	public readonly registrationAtom = this._registrationAtom

	/**
	 * Gets the update availability atom.
	 * Returns an atom containing true when a service worker update is ready to be applied.
	 */
	public readonly updateAvailableAtom = this._updateAvailableAtom

	/**
	 * Applies the pending service worker update by sending skip waiting message
	 * and reloading the page.
	 */
	public readonly applyUpdate = atom(null, (get) => {
		const registration = get(this._registrationAtom)
		if (registration?.waiting) {
			registration.waiting.postMessage({ type: "SKIP_WAITING" })
		}
		window.location.reload()
	})

	/**
	 * Dismisses the update notification without applying the update.
	 */
	public readonly dismissUpdate = atom(null, () => {
		this.updateAvailableBus.emitEvent(false)
	})

	/**
	 * Registers the service worker and sets up update detection.
	 * This method handles the complete service worker lifecycle.
	 */
	private readonly registerServiceWorker = async (): Promise<void> => {
		if (!("serviceWorker" in navigator)) {
			Logger.info(
				"Service workers are not supported in this browser; Registration filed",
			)
			return
		}

		try {
			const registration =
				await navigator.serviceWorker.register("/sw.js")
			Logger.info("SW registered: ", registration)

			// Update registration state
			this.registrationBus.emitEvent(registration)

			// Check for updates
			registration.addEventListener("updatefound", () => {
				const newWorker = registration.installing
				if (newWorker) {
					newWorker.addEventListener("statechange", () => {
						if (
							newWorker.state === "installed" &&
							navigator.serviceWorker.controller
						) {
							// New version available, update state
							this.updateAvailableBus.emitEvent(true)
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
			Logger.error("SW registration failed: ", error)
		}
	}

	/**
	 * Creates a PWA service instance that listens for the custom 'sw-update-available' event.
	 * This is useful when the service worker registration is handled elsewhere
	 * and this service only needs to respond to update notifications.
	 */
	public static readonly createFromEventListener = () => {
		const service = new SwService()

		// Listen for custom sw-update-available events
		const handleUpdateAvailable = (event: Event) => {
			const registration = (event as CustomEvent)
				.detail as ServiceWorkerRegistration
			service.registrationBus.emitEvent(registration)
			service.updateAvailableBus.emitEvent(true)
		}

		window.addEventListener("sw-update-available", handleUpdateAvailable)

		// Return cleanup function along with service
		return {
			service,
			cleanup: () => {
				window.removeEventListener(
					"sw-update-available",
					handleUpdateAvailable,
				)
			},
		}
	}

	/**
	 * Creates a PWA service instance and automatically registers the service worker.
	 * This is the most complete option that handles the entire service worker lifecycle.
	 */
	public static readonly createWithRegistration = () => {
		const service = new SwService()
		void service.registerServiceWorker()
		return service
	}
}
