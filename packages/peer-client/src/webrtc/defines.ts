import { Conn } from "../conn"

export interface IceCandidate {
	readonly candidate?: string
	readonly sdpMid?: string | null
	readonly sdpMLineIndex?: number | null
	readonly usernameFragment?: string // Changed to string | undefined
}

export interface WebRTCClient {
	begin: () => Promise<WebRTCConnInit>
}

export interface WebRTCConnInit {
	readonly clientSdp: ArrayBuffer

	handleAnswerSdp: (serverSdp: ArrayBuffer) => Promise<WebRTCConnICE>
	close: () => Promise<void>
}

export interface WebRTCConnICE {
	getLocalIceCandidates: () => Promise<IceCandidate[]>
	addRemoteIceCandidate: (candidate: IceCandidate) => Promise<void>

	finalize: () => Promise<Conn<ArrayBuffer>>
	close: () => Promise<void>
}

export interface WebRTCServerAcceptResult {
	readonly answerSdp: ArrayBuffer
	readonly iceHandler: WebRTCConnICE
}

export interface WebRTCServer {
	answerConnect: (clientSdp: ArrayBuffer) => Promise<WebRTCServerAcceptResult>
}
