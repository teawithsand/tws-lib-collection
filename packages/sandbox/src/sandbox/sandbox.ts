import {
	atom,
	atomWithImmer,
	DefaultEventBus,
	JotaiStore,
	Subscribable,
} from "@teawithsand/fstate"
import { libraryLogger } from "../log"
import { childMessageSchema } from "./childMessage"
import { IframeEvent, IframeEventType, IframeManager } from "./iframeManager"
import { SandboxMessage, SandboxMessageType } from "./sandboxMessage"

export type SandboxOptions = {
	store: JotaiStore
	iframe?: HTMLIFrameElement
}

export type SandboxState = {
	html: string
	loaded: boolean
	domContentLoaded: boolean
	hasErrored: boolean
}

const LOG_TAG = "Sandbox"
const logger = libraryLogger.createTaggedLogger(LOG_TAG)

export class Sandbox {
	protected readonly iframeManager
	private readonly store: JotaiStore

	private readonly _eventBus = new DefaultEventBus<SandboxMessage>()

	private readonly _state

	public readonly state

	constructor({ iframe, store }: SandboxOptions) {
		this._state = atomWithImmer<SandboxState>({
			html: "",
			loaded: false,
			domContentLoaded: false,
			hasErrored: false,
		})
		this.state = atom((get) => get(this._state))
		this.store = store
		this.iframeManager = new IframeManager(iframe)
		this.setupMessageHandling()
	}

	/**
	 * Sets up message handling between iframe and event bus
	 */
	private readonly setupMessageHandling = (): void => {
		this.iframeManager.bus.addSubscriber((iframeEvent: IframeEvent) => {
			if (iframeEvent.type === IframeEventType.MESSAGE) {
				this.handleIframeMessage(iframeEvent.data)
			}
		})
	}

	/**
	 * Converts a child message to a sandbox message
	 */
	private readonly convertToSandboxMessage = (
		childMessage: any,
	): SandboxMessage | null => {
		switch (childMessage.type) {
			case "console":
				return {
					type: SandboxMessageType.CONSOLE,
					level: childMessage.level,
					args: childMessage.args,
					timestamp: childMessage.timestamp,
				}
			case "unhandledRejection":
				return {
					type: SandboxMessageType.UNHANDLED_REJECTION,
					reason: childMessage.reason,
					promise: childMessage.promise,
					timestamp: childMessage.timestamp,
				}
			case "unhandledError":
				return {
					type: SandboxMessageType.ERROR,
					message: childMessage.message,
					filename: childMessage.filename,
					stack: childMessage.stack,
					timestamp: childMessage.timestamp,
				}
			default:
				return null
		}
	}

	/**
	 * Handles messages received from the iframe, parses them and forwards to event bus
	 */
	private readonly handleIframeMessage = (data: unknown): void => {
		try {
			const parsedMessage = childMessageSchema.parse(data)

			if (parsedMessage.type === "load") {
				this.store.set(this._state, (draft) => {
					draft.loaded = true
				})
			} else if (parsedMessage.type === "domContentLoaded") {
				this.store.set(this._state, (draft) => {
					draft.domContentLoaded = true
				})
			} else if (
				parsedMessage.type === "unhandledRejection" ||
				parsedMessage.type === "unhandledError"
			) {
				this.store.set(this._state, (draft) => {
					draft.hasErrored = true
				})
			}

			const sandboxMessage = this.convertToSandboxMessage(parsedMessage)

			if (sandboxMessage) {
				this._eventBus.emitEvent(sandboxMessage)
			}
		} catch (error) {
			logger.notice("Invalid sandbox message received", { data, error })
		}
	}

	get bus(): Subscribable<SandboxMessage> {
		return this._eventBus
	}

	private resetState = (html: string) => {
		this.store.set(this._state, {
			html,
			loaded: false,
			domContentLoaded: false,
			hasErrored: false,
		})
	}

	loadHtml = (html: string) => {
		this.iframeManager.setHtml(html)
		this.resetState(html)
	}

	unload = () => {
		this.iframeManager.setHtml("")
	}

	release = () => {
		this.iframeManager.release()
	}
}
