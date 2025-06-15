import { Language, TransPickerImpl } from "@teawithsand/fstate"
import { translationRu } from "./translation"
import { translationEnUs } from "./translation/translationEnUs"
import { translationPl } from "./translation/translationPl"

// TODO(teawithsand): consider putting it in di and making it non-global
export const AppTransPicker = new TransPickerImpl({
	fallbackLanguage: Language.ENGLISH_US,
	translations: [translationEnUs, translationPl, translationRu],
})
