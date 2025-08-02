import { AbookHeaderData, Id } from "../../defines"
import { AbookHandle } from "./abookHandle"

export interface AbookStore {
	createAbook: (data: AbookHeaderData) => Promise<AbookHandle>
	listAbooks: () => Promise<AbookHandle[]>
	get: (id: Id) => Promise<AbookHandle>
}
