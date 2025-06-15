import { DI } from "@teawithsand/lngext"
import { AppDiContents } from "./di"

export class App {
	public readonly mintay
	public readonly logger
	public readonly atomStore
	public readonly collectionService
	public readonly transService
	private readonly releaseHelper

	constructor(di: DI<AppDiContents>) {
		this.mintay = di.get("mintay")
		this.logger = di.get("logger")
		this.atomStore = di.get("atomStore")
		this.collectionService = di.get("collectionService")
		this.releaseHelper = di.get("releaseHelper")
		this.transService = di.get("translationService")
	}

	public readonly release = async () => {
		await this.releaseHelper.release()
	}
}
