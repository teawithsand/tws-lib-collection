import { TimeAddressData } from "./timeAddress"

/**
 * Contains information about the local host this host is paired with, which is the same host.
 */
export type PairLocalData = {
	/**
	 * Public ID of host. Used to identify the host in connecting phase, so remote party knows which encryption key to use.
	 */
	hostId: string
	/**
	 * Encryption key for this host.
	 */
	encryptionKey: ArrayBuffer
	/**
	 * Address information for this host.
	 */
	address: {
		/**
		 * Time-based address data for this host.
		 */
		timeAddress: TimeAddressData
		/**
		 * Static address for this host.
		 */
		staticAddress: ArrayBuffer
	}
}

/**
 * Contains information about the remote host this host is paired with.
 */
export type PairRemoteData = {
	/**
	 * Public ID of host. Used to identify the host in connecting phase, so remote party knows which encryption key to use.
	 * Randomized per pair.
	 */
	hostId: string
	/**
	 * Encryption key for the remote host.
	 */
	encryptionKey: ArrayBuffer
	/**
	 * Address information for the remote host.
	 */
	address: {
		/**
		 * Time-based address data for the remote host.
		 */
		timeAddress: TimeAddressData
		/**
		 * Static address for the remote host.
		 */
		staticAddress: ArrayBuffer
	}
}

/**
 * Contains both local and remote data about remote host this host is paired with.
 */
export type PairData = {
	/**
	 * Data about the local host.
	 */
	local: PairLocalData
	/**
	 * Data about the remote host.
	 */
	remote: PairRemoteData
}
