/**
 * TypeSpec defines the minimal, generic structure for Mintay type specifications.
 *
 * This interface is intended as a base for more specific type specs, such as {@link MintayTypeSpec},
 * which provide concrete types for collection data, card data, state, event, and queue.
 *
 * In most application code, you should use {@link MintayTypeSpec} or {@link MintayTypeSpec<T>} instead of this base type.
 *
 * @property collectionData - Arbitrary data associated with the collection as a whole. In {@link MintayTypeSpec}, this is strongly typed.
 * @property cardData - Arbitrary data associated with individual cards. In {@link MintayTypeSpec}, this is strongly typed.
 * @property cardState - State information for individual cards, such as progress or scheduling. In {@link MintayTypeSpec}, this is strongly typed.
 * @property cardEvent - Event data or metadata related to card actions or history. In {@link MintayTypeSpec}, this is strongly typed.
 * @property queue - Identifier for the queue to which the card belongs; can be a string or number. In {@link MintayTypeSpec}, this is typically an enum.
 *
 * @see MintayTypeSpec for the main type used in Mintay applications.
 * @see MintayTypeSpecParams for customizing Mintay types.
 */
export interface TypeSpec {
	collectionData: Record<string, unknown>
	cardData: Record<string, unknown>
	cardState: Record<string, unknown>
	cardEvent: Record<string, unknown>
	queue: string | number
}
