import { Conn } from "../conn"
import { MessageQueue } from "../util/messageQueue"
import {
	IceCandidate,
	WebRTCClient,
	WebRTCConnICE,
	WebRTCConnInit,
	WebRTCServer,
	WebRTCServerAcceptResult,
} from "./defines"

import adapter from "webrtc-adapter"
void adapter // Ensure adapter is loaded for polyfills

const sdpToString = (buffer: ArrayBuffer): string =>
	new TextDecoder().decode(buffer)
const stringToSdp = (str: string): ArrayBuffer =>
	new TextEncoder().encode(str).buffer

class ConnImpl implements Conn<ArrayBuffer> {
	private dataChannel: RTCDataChannel
	private receiveQueue: MessageQueue<ArrayBuffer>

	public constructor(dataChannel: RTCDataChannel) {
		this.dataChannel = dataChannel
		this.dataChannel.binaryType = "arraybuffer"
		this.receiveQueue = new MessageQueue<ArrayBuffer>()

		this.dataChannel.onmessage = (event: MessageEvent) => {
			if (event.data instanceof ArrayBuffer) {
				this.receiveQueue.send(event.data)
			} else {
				// Optionally, set an error on the queue or close the connection
				// this.receiveQueue.setError(new Error("Received non-ArrayBuffer message"));
			}
		}

		this.dataChannel.onclose = () => {
			this.receiveQueue.setError(new Error("Data channel closed"))
		}
		this.dataChannel.onerror = (event: Event) => {
			const error =
				(event as RTCErrorEvent)?.error ||
				new Error("Data channel error")
			this.receiveQueue.setError(error)
		}
	}

	public readonly receive = async (): Promise<ArrayBuffer> => {
		return this.receiveQueue.receive()
	}

	public readonly send = async (message: ArrayBuffer): Promise<void> => {
		if (this.dataChannel.readyState === "open") {
			this.dataChannel.send(message)
		} else {
			// Throw an error or handle silently, depending on desired behavior
			throw new Error(
				`Data channel is not open. Current state: ${this.dataChannel.readyState}`,
			)
		}
	}

	public readonly close = (): void => {
		if (
			this.dataChannel.readyState === "open" ||
			this.dataChannel.readyState === "connecting"
		) {
			this.dataChannel.close()
		}
	}
}

class SharedWebRTCConnICEImpl implements WebRTCConnICE {
	protected pc: RTCPeerConnection
	protected dataChannelIsActuallyReadyPromise: Promise<RTCDataChannel>
	protected localCandidatesStore: IceCandidate[]
	protected iceGatheringCompletePromise: Promise<void>

	public constructor(
		pc: RTCPeerConnection,
		dataChannelReadyPromise: Promise<RTCDataChannel>,
		localCandidatesStore: IceCandidate[],
		iceGatheringCompletePromise: Promise<void>,
	) {
		this.pc = pc
		this.dataChannelIsActuallyReadyPromise = dataChannelReadyPromise
		this.localCandidatesStore = localCandidatesStore
		this.iceGatheringCompletePromise = iceGatheringCompletePromise
	}

	public readonly getLocalIceCandidates = async (): Promise<
		IceCandidate[]
	> => {
		await this.iceGatheringCompletePromise
		return [...this.localCandidatesStore] // Return a copy
	}

	public readonly addRemoteIceCandidate = async (
		candidateInfo: IceCandidate,
	): Promise<void> => {
		const rtcIceCandidate = new RTCIceCandidate(
			candidateInfo as RTCIceCandidateInit,
		)
		await this.pc.addIceCandidate(rtcIceCandidate)
	}

	public readonly finalize = async (): Promise<Conn<ArrayBuffer>> => {
		const dataChannel = await this.dataChannelIsActuallyReadyPromise

		if (this.pc.connectionState !== "connected") {
			await new Promise<void>((resolve, reject) => {
				const handler = () => {
					if (this.pc.connectionState === "connected") {
						this.pc.removeEventListener(
							"connectionstatechange",
							handler,
						)
						resolve()
					} else if (
						["failed", "closed", "disconnected"].includes(
							this.pc.connectionState,
						)
					) {
						this.pc.removeEventListener(
							"connectionstatechange",
							handler,
						)
						reject(
							new Error(
								`Peer connection failed. State: ${this.pc.connectionState}`,
							),
						)
					}
				}
				this.pc.addEventListener("connectionstatechange", handler)
				if (
					this.pc.connectionState === "connected" ||
					["failed", "closed", "disconnected"].includes(
						this.pc.connectionState,
					)
				) {
					handler()
				}
			})
		}
		return new ConnImpl(dataChannel)
	}

	public readonly close = async (): Promise<void> => {
		if (this.pc.signalingState !== "closed") {
			this.pc.close()
		}
	}
}

export class WebRTCClientImpl implements WebRTCClient {
	private readonly configuration: RTCConfiguration

	public constructor(configuration: RTCConfiguration) {
		this.configuration = configuration
	}

	public readonly begin = async (): Promise<WebRTCConnInit> => {
		const pc = new RTCPeerConnection(this.configuration)
		const localCandidatesStore: IceCandidate[] = []
		let iceGatheringResolveFunction: (() => void) | undefined
		const iceGatheringCompletePromise = new Promise<void>((resolve) => {
			iceGatheringResolveFunction = resolve
		})

		pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
			if (event.candidate) {
				localCandidatesStore.push(
					event.candidate.toJSON() as IceCandidate,
				)
			} else {
				// null candidate (end of this generation)
			}
		}
		pc.onicegatheringstatechange = () => {
			if (
				pc.iceGatheringState === "complete" &&
				iceGatheringResolveFunction
			) {
				iceGatheringResolveFunction()
				iceGatheringResolveFunction = undefined
			}
		}

		const dataChannel = pc.createDataChannel("sendChannel", {
			negotiated: false,
		})
		const clientDataChannelReadyPromise = new Promise<RTCDataChannel>(
			(resolve, reject) => {
				if (dataChannel.readyState === "open") {
					resolve(dataChannel)
					return
				}
				const openHandler = () => {
					dataChannel.removeEventListener("open", openHandler)
					dataChannel.removeEventListener("error", errorHandler)
					resolve(dataChannel)
				}
				const errorHandler = (ev: Event) => {
					dataChannel.removeEventListener("open", openHandler)
					dataChannel.removeEventListener("error", errorHandler)
					reject(
						(ev as RTCErrorEvent)?.error ||
							new Error("Client DataChannel error during setup"),
					)
				}
				dataChannel.addEventListener("open", openHandler)
				dataChannel.addEventListener("error", errorHandler)
			},
		)

		const offer = await pc.createOffer()
		await pc.setLocalDescription(offer)

		if (
			pc.iceGatheringState === "complete" &&
			iceGatheringResolveFunction
		) {
			iceGatheringResolveFunction()
			iceGatheringResolveFunction = undefined
		}

		const clientSdp = stringToSdp(offer.sdp!)

		const connInit: WebRTCConnInit = {
			clientSdp,
			handleAnswerSdp: async (
				serverSdpEncoded: ArrayBuffer,
			): Promise<WebRTCConnICE> => {
				if (pc.signalingState === "closed") {
					const errorMessage =
						"Client PC: handleAnswerSdp called, but PeerConnection is already closed."
					throw new Error(errorMessage)
				}
				const serverSdpString = sdpToString(serverSdpEncoded)
				await pc.setRemoteDescription({
					type: "answer",
					sdp: serverSdpString,
				})
				return new SharedWebRTCConnICEImpl(
					pc,
					clientDataChannelReadyPromise,
					localCandidatesStore,
					iceGatheringCompletePromise,
				)
			},
			close: async (): Promise<void> => {
				if (pc.signalingState !== "closed") {
					pc.close()
				}
			},
		}

		return connInit
	}
}

export class WebRTCServerImpl implements WebRTCServer {
	private readonly configuration: RTCConfiguration
	private readonly dataChannelTimeoutMs: number

	public constructor({
		configuration,
		dataChannelTimeoutMs = 15000,
	}: {
		configuration: RTCConfiguration
		dataChannelTimeoutMs?: number
	}) {
		this.configuration = configuration
		this.dataChannelTimeoutMs = dataChannelTimeoutMs
	}

	public readonly answerConnect = async (
		clientSdpEncoded: ArrayBuffer,
	): Promise<WebRTCServerAcceptResult> => {
		const pc = new RTCPeerConnection(this.configuration)
		const localCandidatesStore: IceCandidate[] = []
		let iceGatheringResolveFunction: (() => void) | undefined
		const iceGatheringCompletePromise = new Promise<void>((resolve) => {
			iceGatheringResolveFunction = resolve
		})

		pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
			if (event.candidate) {
				localCandidatesStore.push(
					event.candidate.toJSON() as IceCandidate,
				)
			} else {
				// null candidate (end of this generation)
			}
		}
		pc.onicegatheringstatechange = () => {
			if (
				pc.iceGatheringState === "complete" &&
				iceGatheringResolveFunction
			) {
				iceGatheringResolveFunction()
				iceGatheringResolveFunction = undefined
			}
		}

		const serverDataChannelFromEventPromise = new Promise<RTCDataChannel>(
			(resolve, reject) => {
				pc.ondatachannel = (event: RTCDataChannelEvent) => {
					const dc = event.channel
					resolve(dc)
				}
				const timeoutId = setTimeout(() => {
					reject(
						new Error(
							"Timeout waiting for ondatachannel event on server",
						),
					)
				}, this.dataChannelTimeoutMs)
				pc.addEventListener(
					"datachannel",
					() => clearTimeout(timeoutId),
					{ once: true },
				)
			},
		)

		const serverDataChannelIsActuallyReadyPromise =
			serverDataChannelFromEventPromise.then((dc) => {
				return new Promise<RTCDataChannel>(
					(resolveDcReady, rejectDcReady) => {
						if (dc.readyState === "open") {
							resolveDcReady(dc)
							return
						}
						const openHandler = () => {
							dc.removeEventListener("open", openHandler)
							dc.removeEventListener("error", errorHandler)
							resolveDcReady(dc)
						}
						const errorHandler = (ev: Event) => {
							dc.removeEventListener("open", openHandler)
							dc.removeEventListener("error", errorHandler)
							rejectDcReady(
								(ev as RTCErrorEvent)?.error ||
									new Error(
										"Server DataChannel error on open",
									),
							)
						}
						dc.addEventListener("open", openHandler)
						dc.addEventListener("error", errorHandler)
					},
				)
			})

		const clientSdpString = sdpToString(clientSdpEncoded)
		await pc.setRemoteDescription({ type: "offer", sdp: clientSdpString })

		const answer = await pc.createAnswer()
		await pc.setLocalDescription(answer)

		if (
			pc.iceGatheringState === "complete" &&
			iceGatheringResolveFunction
		) {
			iceGatheringResolveFunction()
			iceGatheringResolveFunction = undefined
		}

		const answerSdp = stringToSdp(answer.sdp!)
		const iceHandler = new SharedWebRTCConnICEImpl(
			pc,
			serverDataChannelIsActuallyReadyPromise,
			localCandidatesStore,
			iceGatheringCompletePromise,
		)

		return {
			answerSdp,
			iceHandler,
		}
	}
}
