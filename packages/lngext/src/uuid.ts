export const generateUuid = (): string => {
	// Prioritize Web Crypto API (crypto.randomUUID) if available
	if (typeof crypto !== "undefined" && crypto.randomUUID) {
		return crypto.randomUUID()
	}
	// Fallback for environments where crypto.randomUUID is not available
	// Try to use crypto.getRandomValues if available
	if (typeof crypto !== "undefined" && crypto.getRandomValues) {
		const buffer = new Uint8Array(16)
		crypto.getRandomValues(buffer)
		// Set version (4) and variant (8, 9, A, or B)
		buffer[6] = (buffer[6]! & 0x0f) | 0x40 // Version 4
		buffer[8] = (buffer[8]! & 0x3f) | 0x80 // Variant RFC4122
		return Array.from(buffer)
			.map((b, i) => {
				const hex = b.toString(16).padStart(2, "0")
				if (i === 3 || i === 5 || i === 7 || i === 9) {
					return hex + "-"
				}
				return hex
			})
			.join("")
			.slice(0, 36) // Ensure correct length with hyphens
	}
	// Final fallback to Math.random() if no crypto API is available
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0
		const v = c === "x" ? r : (r & 0x3) | 0x8
		return v.toString(16)
	})
}
