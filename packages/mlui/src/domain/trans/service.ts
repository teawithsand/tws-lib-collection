import {
	atom,
	BrowserLanguageAtomProvider,
	Language,
	TransStringResolverImpl,
	type Atom,
	type TransPicker,
} from "@teawithsand/fstate"
import { inPlace } from "@teawithsand/lngext"

interface BaseTranslation {
	language: Language
}

interface TransServiceOptions<TTranslation extends BaseTranslation> {
	transPicker: TransPicker<TTranslation>
	languagesAtom?: Atom<readonly Language[]>
}

export class TransService<TTranslation extends BaseTranslation> {
	private readonly languagesAtom: Atom<readonly Language[]>

	private readonly transPicker: TransPicker<TTranslation>

	public constructor({
		transPicker,
		languagesAtom = BrowserLanguageAtomProvider.createLanguagesAtom(),
	}: TransServiceOptions<TTranslation>) {
		this.transPicker = transPicker
		this.languagesAtom = languagesAtom
	}

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
			return this.transPicker.pickTranslation([override])
		}

		const languages = get(this.languagesAtom)
		return this.transPicker.pickTranslation([...languages])
	})

	public readonly translationLanguage = atom(
		(get) => get(this.translation).language,
	)

	public readonly resolver = atom((get) => {
		return new TransStringResolverImpl({
			translation: get(this.translation),
		})
	})
}
