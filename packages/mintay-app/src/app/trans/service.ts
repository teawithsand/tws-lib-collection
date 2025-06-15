import {
	atom,
	BrowserLanguageAtomProvider,
	Language,
	TransStringResolverImpl,
} from "@teawithsand/fstate"
import { inPlace } from "@teawithsand/lngext"
import { AppTransPicker } from "./picker"

export class TransService {
	private readonly languagesAtom =
		BrowserLanguageAtomProvider.createLanguagesAtom()

	public readonly languageOverride = inPlace(() => {
		const inner = atom<Language | null>(null)

		return atom(
			(get) => get(inner),
			(_get, set, value: Language | null) => {
				set(inner, value)
			},
		)
	})

	public readonly translation = atom((get) => {
		const override = get(this.languageOverride)
		if (override) {
			return AppTransPicker.pickTranslation([override])
		}

		const languages = get(this.languagesAtom)
		return AppTransPicker.pickTranslation([...languages])
	})

	public readonly language = atom((get) => get(this.translation).language)

	public readonly resolver = atom((get) => {
		return new TransStringResolverImpl({
			translation: get(this.translation),
		})
	})
}
