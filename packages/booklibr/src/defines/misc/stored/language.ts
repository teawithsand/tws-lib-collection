import { z } from "zod"
import { Language } from "../language"

export const storedLanguageV1Schema = z.object({
	version: z.literal(1),
	language: z.nativeEnum(Language), // This is ok. For language enum do not create separate stored enum.
})

export type StoredLanguageV1 = z.infer<typeof storedLanguageV1Schema>

export const StoredLanguageSchema = storedLanguageV1Schema
export type StoredLanguage = z.infer<typeof StoredLanguageSchema>

export class LanguageSerializer {
	private constructor() {}

	public static readonly serialize = (input: {
		language: Language
	}): StoredLanguageV1 => ({
		version: 1,
		language: input.language,
	})

	public static readonly deserialize = (
		stored: unknown,
	): { language: Language } => {
		const parsed = storedLanguageV1Schema.parse(stored)
		return { language: parsed.language }
	}
}
