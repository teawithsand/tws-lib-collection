import { Conn } from "../conn"

export type PairAuthBeginResult = {
	publicPairingIdentifier: string
}

export type PairAuthFinalizeResult = {
	encryptedConnection: Conn
}

export type PairAuthData = {
	localSecret: ArrayBuffer
	remoteSecret: ArrayBuffer
}

export class PairAuth {
	constructor() {}

	public readonly begin = () // conn: Conn,
	: Promise<PairAuthBeginResult> => {
		throw new Error(`NIY`)
	}

	public readonly finalize = () // conn: Conn,
	// authData: PairAuthData,
	: Promise<PairAuthFinalizeResult> => {
		throw new Error(`NIY`)
	}
}
