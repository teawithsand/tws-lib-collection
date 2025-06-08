export type DIContents = {
	[key: string]: {}
}

export type DIDefinitionObject<T extends Record<string, any>> = {
	[K in keyof T]: undefined | null
}

export type DIContentsFactory<T extends DIContents> = {
	[K in keyof T]: (di: DI<T>) => Promise<T[K]>
}

export interface DI<T extends DIContents> {
	get: <K extends keyof T>(key: K) => T[K]
}
