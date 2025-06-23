import { FsWriter } from "../defines/writer"

/**
 * Not Implemented Yet (NIY) OPFS writer implementation.
 */
export class OpfsWriter implements FsWriter {
	public readonly write = async (
		_data: ArrayBuffer | Blob,
	): Promise<void> => {
		throw new Error("OPFS writer write() - Not implemented yet")
	}

	public readonly close = async (): Promise<void> => {
		throw new Error("OPFS writer close() - Not implemented yet")
	}
}
