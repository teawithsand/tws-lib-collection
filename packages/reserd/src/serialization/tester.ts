import {
	BaseError,
	DeepEqualComparator,
	EqualComparator,
	Errors,
} from "@teawithsand/lngext"
import { Serializer } from "./serializer"

export const SerializerTesterError = Errors.makeErrorType(
	"SerializerTesterError",
	BaseError,
)

/**
 * TestData class for providing test data to SerializerTester.
 * It contains examples of Stored and Owned types that will be used
 * to validate serialization and deserialization operations.
 *
 * @template Stored The stored data type (serialized format)
 * @template Owned The owned data type (application format)
 */
export class TestData<Stored, Owned> {
	public readonly storedExamples: Stored[]
	public readonly ownedExamples: Owned[]
	public readonly pairExamples: [Stored, Owned][]

	/**
	 * Creates a new TestData instance with all types of examples
	 *
	 * @param param0 Configuration object containing all examples
	 */
	public constructor({
		storedExamples = [],
		ownedExamples = [],
		pairExamples = [],
	}: {
		storedExamples?: Stored[]
		ownedExamples?: Owned[]
		pairExamples?: [Stored, Owned][]
	}) {
		this.storedExamples = storedExamples
		this.ownedExamples = ownedExamples
		this.pairExamples = pairExamples
	}

	/**
	 * Creates a TestData instance from pairs of stored and owned objects.
	 * This method also extracts the stored and owned examples from the pairs
	 * to populate all three arrays of the TestData instance.
	 *
	 * @param pairs An array of [stored, owned] pairs
	 * @returns A new TestData instance with examples populated from pairs
	 */
	public static readonly createFromPairs = <S, O>(
		pairs: [S, O][],
	): TestData<S, O> => {
		const storedExamples = pairs.map(([stored]) => stored)
		const ownedExamples = pairs.map(([, owned]) => owned)

		return new TestData<S, O>({
			storedExamples,
			ownedExamples,
			pairExamples: pairs,
		})
	}

	/**
	 * Creates a comprehensive TestData instance with all types of examples.
	 *
	 * @param param0 Configuration object containing all examples
	 * @returns A new TestData instance
	 */
	public static readonly createComplete = <S, O>({
		storedExamples = [],
		ownedExamples = [],
		pairExamples = [],
	}: {
		storedExamples?: S[]
		ownedExamples?: O[]
		pairExamples?: [S, O][]
	}): TestData<S, O> => {
		return new TestData<S, O>({
			storedExamples,
			ownedExamples,
			pairExamples,
		})
	}
}

/**
 * Class for testing serializers that convert between Stored and Owned types.
 * It validates that serialization and deserialization work correctly in both directions.
 *
 * @template Stored The stored data type (serialized format)
 * @template Owned The owned data type (application format)
 */
export class SerializerTester<Stored, Owned> {
	private readonly testData: TestData<Stored, Owned>
	private readonly serializer: Serializer<Stored, Owned>
	private readonly equalComparator: EqualComparator<any>

	/**
	 * Creates a new SerializerTester instance
	 *
	 * @param param0 Configuration object
	 */
	public constructor({
		testData,
		serializer,
		equalComparator = new DeepEqualComparator(),
	}: {
		testData: TestData<Stored, Owned>
		serializer: Serializer<Stored, Owned>
		equalComparator?: EqualComparator<any>
	}) {
		this.testData = testData
		this.serializer = serializer
		this.equalComparator = equalComparator
	}

	/**
	 * Tests serialization of Owned objects to Stored format
	 * Throws an error if serialization fails
	 */
	public readonly testSerialize = (): void => {
		// Test owned examples
		for (const owned of this.testData.ownedExamples) {
			try {
				this.serializer.serialize(owned)
			} catch (error) {
				throw new SerializerTesterError(
					`Serialization failed for owned object: ${JSON.stringify(owned)}\nError: ${error}`,
					error,
				)
			}
		}

		// Test pair examples
		for (const [stored, owned] of this.testData.pairExamples) {
			try {
				const serialized = this.serializer.serialize(owned)
				this.assertEquivalent(
					serialized,
					stored,
					"Serialized owned object does not match expected stored format",
				)
			} catch (error) {
				throw new SerializerTesterError(
					`Serialization failed for paired example: ${JSON.stringify(owned)}\nError: ${error}`,
					error,
				)
			}
		}
	}

	/**
	 * Tests deserialization of Stored objects to Owned format
	 * Throws an error if deserialization fails
	 */
	public readonly testDeserialize = (): void => {
		// Test stored examples
		for (const stored of this.testData.storedExamples) {
			try {
				this.serializer.deserialize(stored)
			} catch (error) {
				throw new SerializerTesterError(
					`Deserialization failed for stored object: ${JSON.stringify(stored)}\nError: ${error}`,
					error,
				)
			}
		}

		// Test pair examples
		for (const [stored, owned] of this.testData.pairExamples) {
			try {
				const deserialized = this.serializer.deserialize(stored)
				this.assertEquivalent(
					deserialized,
					owned,
					"Deserialized stored object does not match expected owned format",
				)
			} catch (error) {
				throw new SerializerTesterError(
					`Deserialization failed for paired example: ${JSON.stringify(stored)}\nError: ${error}`,
					error,
				)
			}
		}
	}

	/**
	 * Tests serialization and deserialization round trip
	 * Confirms that serialize(deserialize(stored)) === stored and deserialize(serialize(owned)) === owned
	 * Throws an error if round trip fails
	 */
	public readonly testRoundTrip = (): void => {
		// Note that round trips ending in Stored are not tested here, since during such round trip version update may occur,
		// which would change structure of the Stored object, which would cause such test to fail.

		// Owned -> Stored -> Owned round trip
		for (const owned of this.testData.ownedExamples) {
			try {
				const stored = this.serializer.serialize(owned)
				const roundTripped = this.serializer.deserialize(stored)
				this.assertEquivalent(
					roundTripped,
					owned,
					"Round trip Owned->Stored->Owned failed",
				)
			} catch (error) {
				throw new SerializerTesterError(
					`Round trip Owned->Stored->Owned failed for: ${JSON.stringify(owned)}\nError: ${error}`,
					error,
				)
			}
		}
	}

	/**
	 * Run all tests on the serializer
	 * Throws an error if any test fails
	 */
	public readonly runAllTests = (): void => {
		this.testSerialize()
		this.testDeserialize()
		this.testRoundTrip()
	}

	/**
	 * Helper function to compare two objects for deep equality
	 *
	 * @param actual The actual value
	 * @param expected The expected value
	 * @param message Error message if assertion fails
	 */
	private readonly assertEquivalent = (
		actual: unknown,
		expected: unknown,
		message: string,
	): void => {
		try {
			if (!this.equalComparator.equals(actual, expected)) {
				throw new SerializerTesterError(
					`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`,
				)
			}
		} catch (error) {
			throw new SerializerTesterError(
				`Comparison failed: ${error}`,
				error,
			)
		}
	}
}
