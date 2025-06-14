import { DI } from "@teawithsand/lngext"
import { AppDiContents } from "./di"

export class App {
	public readonly mintay
	public readonly logger

	constructor(di: DI<AppDiContents>) {
		this.mintay = di.get("mintay")
		this.logger = di.get("logger")
	}
}
