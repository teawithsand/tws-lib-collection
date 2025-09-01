import { VersionedType } from "@teawithsand/reserd"
import { z } from "zod"

export type Theme = "light" | "dark" | "auto"

enum ThemeStored {
	LIGHT = "light",
	DARK = "dark",
	AUTO = "auto",
}

type ThemeStoredV1 = ThemeStored

type ThemeVersionedData = {
	1: ThemeStoredV1
}

const themeStoredV1Schema = z.nativeEnum(ThemeStored)

export const themeVersionedType = new VersionedType<ThemeVersionedData, Theme>({
	serializer: (owned: Theme) => ({
		version: 1 as const,
		data: (() => {
			switch (owned) {
				case "light":
					return ThemeStored.LIGHT
				case "dark":
					return ThemeStored.DARK
				case "auto":
					return ThemeStored.AUTO
				default:
					return ThemeStored.AUTO
			}
		})(),
	}),
	deserializer: {
		1: {
			schema: themeStoredV1Schema,
			deserializer: (data: ThemeStoredV1): Theme => {
				switch (data) {
					case ThemeStored.LIGHT:
						return "light"
					case ThemeStored.DARK:
						return "dark"
					case ThemeStored.AUTO:
						return "auto"
					default:
						return "auto"
				}
			},
		},
	},
})
