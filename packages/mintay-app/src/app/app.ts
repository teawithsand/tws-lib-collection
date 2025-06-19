import { DI } from "@teawithsand/lngext"
import { BackendService } from "../domain/backend/backendService"
import { BackendClient } from "../domain/backend/client"
import { AppDiContents } from "./di"

export class App {
	public readonly mintay
	public readonly logger
	public readonly atomStore
	public readonly collectionService
	public readonly transService
	public readonly appBarService
	public readonly backendClient: BackendClient
	public readonly backendService: BackendService
	private readonly releaseHelper

	constructor(di: DI<AppDiContents>) {
		this.mintay = di.get("mintay")
		this.logger = di.get("logger")
		this.atomStore = di.get("atomStore")
		this.collectionService = di.get("collectionService")
		this.releaseHelper = di.get("releaseHelper")
		this.transService = di.get("translationService")
		this.appBarService = di.get("appBarService")
		this.backendClient = di.get("backendClient")
		this.backendService = di.get("backendService")
	}

	public readonly release = async () => {
		await this.releaseHelper.release()
	}
}
