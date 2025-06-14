import { DI } from "@teawithsand/lngext"
import { AppDiContents } from "./di"

export class App {
	public readonly mintay
	public readonly logger
	public readonly atomStore
	public readonly collectionService

	constructor(di: DI<AppDiContents>) {
		this.mintay = di.get("mintay")
		this.logger = di.get("logger")
		this.atomStore = di.get("atomStore")
		this.collectionService = di.get("collectionService")
	}
}
