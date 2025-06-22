import { DefaultEventBus, Subscribable } from "@teawithsand/fstate"

/**
 * Event types that can be emitted by the IframeManager.
 */
export enum IframeEventType {
	LOAD = "load",
	MESSAGE = "message",
	ERROR = "error",
}

/**
 * Events emitted by the IframeManager.
 */
export type IframeEvent =
	| {
			type: IframeEventType.LOAD
	  }
	| {
			type: IframeEventType.MESSAGE
			data: any
	  }
	| {
			type: IframeEventType.ERROR
			error: Event
	  }

/**
 * Manages an iframe element, providing functionality to set HTML content via data URLs
 * and clean up resources when no longer needed.
 */
export class IframeManager {
	private iframe: HTMLIFrameElement
	private currentDataUrl: string | null = null
	private wasCreatedByManager: boolean
	private eventListenersAttached = false
	private readonly _eventBus = new DefaultEventBus<IframeEvent>()

	get bus(): Subscribable<IframeEvent> {
		return this._eventBus
	}

	/**
	 * Creates a new IframeManager instance.
	 * @param existingIframe - Optional existing iframe element to manage. If not provided, a new one will be created.
	 */
	constructor(existingIframe?: HTMLIFrameElement) {
		if (existingIframe) {
			this.iframe = existingIframe
			this.wasCreatedByManager = false
		} else {
			this.iframe = document.createElement("iframe")
			// Some defaults for iframe
			this.iframe.style.display = "none"
			this.iframe.sandbox = "allow-scripts allow-forms"
			document.body.appendChild(this.iframe)
			this.wasCreatedByManager = true
		}
		this.attachEventListeners()
	}

	/**
	 * Returns the managed iframe element.
	 * @returns The iframe element being managed.
	 */
	public readonly getIframe = (): HTMLIFrameElement => {
		return this.iframe
	}

	/**
	 * Sets the HTML content of the iframe by creating a data URL.
	 * Any previously created data URL will be revoked to prevent memory leaks.
	 * @param html - The HTML content to display in the iframe.
	 */
	public readonly setHtml = (html: string): void => {
		this.revokeCurrentDataUrl()
		const blob = new Blob([html], { type: "text/html" })
		this.currentDataUrl = URL.createObjectURL(blob)
		this.iframe.src = this.currentDataUrl
	}

	/**
	 * Releases resources and removes the iframe from the DOM if it was created by this manager.
	 * Also revokes any current data URL to prevent memory leaks.
	 */
	public readonly release = (): void => {
		this.revokeCurrentDataUrl()
		this.detachEventListeners()
		if (this.wasCreatedByManager) {
			document.body.removeChild(this.iframe)
			this.wasCreatedByManager = false
		}
	}

	/**
	 * Revokes the current data URL if one exists.
	 * This is a private helper method to clean up blob URLs and prevent memory leaks.
	 */
	private readonly revokeCurrentDataUrl = (): void => {
		if (this.currentDataUrl) {
			URL.revokeObjectURL(this.currentDataUrl)
			this.currentDataUrl = null
		}
	}

	private attachEventListeners(): void {
		if (!this.eventListenersAttached) {
			this.iframe.addEventListener("load", this.handleLoad)
			this.iframe.addEventListener("error", this.handleError)
			window.addEventListener("message", this.handleMessage)
			this.eventListenersAttached = true
		}
	}

	private detachEventListeners(): void {
		if (this.eventListenersAttached) {
			this.iframe.removeEventListener("load", this.handleLoad)
			this.iframe.removeEventListener("error", this.handleError)
			window.removeEventListener("message", this.handleMessage)
			this.eventListenersAttached = false
		}
	}

	private handleLoad = (): void => {
		this._eventBus.emitEvent({ type: IframeEventType.LOAD })
	}

	private handleError = (errorEvent: Event): void => {
		this._eventBus.emitEvent({
			type: IframeEventType.ERROR,
			error: errorEvent,
		})
	}

	private handleMessage = (messageEvent: MessageEvent): void => {
		if (messageEvent.source !== this.iframe.contentWindow) {
			return
		}
		this._eventBus.emitEvent({
			type: IframeEventType.MESSAGE,
			data: messageEvent.data,
		})
	}
}
