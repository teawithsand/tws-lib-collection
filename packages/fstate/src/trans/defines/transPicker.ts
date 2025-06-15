import { Language } from "./language"

export interface TransPicker<T> {
	pickTranslation: (languages: Language[]) => T
}
