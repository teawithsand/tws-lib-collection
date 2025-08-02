import { DI } from "@teawithsand/lngext"
import { AppDiContents } from "./app.di"

export class App {
	public readonly logger
	public readonly atomStore
	public readonly translationService
	public readonly appBarService
	public readonly abookStoreService
	private readonly releaseHelper

	constructor(di: DI<AppDiContents>) {
		this.logger = di.get("logger")
		this.atomStore = di.get("atomStore")
		this.releaseHelper = di.get("releaseHelper")
		this.translationService = di.get("translationService")
		this.appBarService = di.get("appBarService")
		this.abookStoreService = di.get("abookStoreService")
	}

	public readonly release = async () => {
		await this.releaseHelper.release()
	}
}
