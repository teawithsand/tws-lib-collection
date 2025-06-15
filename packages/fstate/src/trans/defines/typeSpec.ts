import { TransString } from "./transString"

export type TransTypeSpec<T> = {
	translation: T
	transString: TransString<T>
}
