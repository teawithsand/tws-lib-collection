/**
 * Represents a complete pairing between two parties.
 * Contains the device information and configuration for both local and remote participants.
 */
export type Pair = {
	/** Remote device name as provided during pairing */
	remoteDeviceName: string

	/** Remote device's static address for communication */
	remoteStaticAddress: string

	/** Remote device's dynamic address generation data */
	remoteDynamicAddressGenerationData: {
		seed: ArrayBuffer
		algorithm: string
		parameters?: Record<string, unknown>
	}

	/** Local device name */
	localDeviceName: string

	/** Time window in milliseconds for time-based identifier generation */
	timeBasedIdentifierWindowMillis: number

	/** Time offset in milliseconds for time-based identifier generation */
	timeBaseIdentifierOffsetMillis: number
}
