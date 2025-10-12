/**
 * Util, which intends to wrap object created by Vite or some other build tool from .module.css/.module.scss files.
 *
 * It detects not existing class names and throws when this occurs, which makes debugging easier.
 */
export class StyleModule {
	constructor(private readonly cssObj: Record<string, string>) {}

	public readonly keys = () => {
		return Object.keys(this.cssObj)
	}

	public readonly get = (name: string) => {
		if (name in this.cssObj) {
			throw new Error(`Class ${name} is not defined`)
		}
		return this.cssObj[name]
	}
}
