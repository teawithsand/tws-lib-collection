import { FsWriter } from "@teawithsand/fstate"

export class InMemoryFsWriter implements FsWriter {
	public constructor(
		private readonly onWrite: (blob: Blob | ArrayBuffer) => Promise<void>,
	) {}

	public readonly write = async (data: Blob | ArrayBuffer): Promise<void> => {
		await this.onWrite(data)
	}

	public readonly close = async (): Promise<void> => {}
}
