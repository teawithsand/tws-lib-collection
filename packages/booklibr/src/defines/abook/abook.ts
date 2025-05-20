import { ABookEntry } from "../entry/entry"
import { Language } from "../misc/language"
import { ABookTruthSource } from "./truthSource"

export type ABookMetadata = {
	title: string
	author: string
	description: string
	language: Language
}

export type ABookHeader = {
	metadata: ABookMetadata
	truthSource: ABookTruthSource
}

export type ABook = {
	header: ABookHeader
	entries: ABookEntry[]
}
