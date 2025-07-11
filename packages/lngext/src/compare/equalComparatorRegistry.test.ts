import { beforeEach, describe, expect, test } from "vitest"
import { EqualComparator } from "./equalComparator"
import {
	EqualComparatorRegistry,
	globalEqualComparatorRegistry,
} from "./equalComparatorRegistry"

// Test classes
class Person {
	public constructor(
		public readonly name: string,
		public readonly age: number,
	) {}
}

class Product {
	public constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly price: number,
	) {}
}

// Test comparators
const personComparator: EqualComparator<Person> = {
	equals: (a: Person, b: Person) => a.name === b.name && a.age === b.age,
}

const productComparator: EqualComparator<Product> = {
	equals: (a: Product, b: Product) => a.id === b.id,
}

describe("EqualComparatorRegistry", () => {
	let registry: EqualComparatorRegistry

	beforeEach(() => {
		registry = new EqualComparatorRegistry()
	})

	test("should register and retrieve comparators for class types", () => {
		// Arrange & Act
		registry.register(Person, personComparator)
		const retrievedComparator = registry.get(Person)

		// Assert
		expect(retrievedComparator).toBe(personComparator)
	})

	test("should return undefined for unregistered types", () => {
		// Act
		const retrievedComparator = registry.get(Person)

		// Assert
		expect(retrievedComparator).toBeUndefined()
	})

	test("should check if comparator is registered", () => {
		// Arrange
		registry.register(Person, personComparator)

		// Act & Assert
		expect(registry.has(Person)).toBe(true)
		expect(registry.has(Product)).toBe(false)
	})

	test("should unregister comparators", () => {
		// Arrange
		registry.register(Person, personComparator)
		expect(registry.has(Person)).toBe(true)

		// Act
		const wasRemoved = registry.unregister(Person)

		// Assert
		expect(wasRemoved).toBe(true)
		expect(registry.has(Person)).toBe(false)
	})

	test("should return false when unregistering non-existent comparator", () => {
		// Act
		const wasRemoved = registry.unregister(Person)

		// Assert
		expect(wasRemoved).toBe(false)
	})

	test("should register multiple different types", () => {
		// Arrange & Act
		registry.register(Person, personComparator)
		registry.register(Product, productComparator)

		// Assert
		expect(registry.get(Person)).toBe(personComparator)
		expect(registry.get(Product)).toBe(productComparator)
		expect(registry.has(Person)).toBe(true)
		expect(registry.has(Product)).toBe(true)
	})

	test("should clear all registered comparators", () => {
		// Arrange
		registry.register(Person, personComparator)
		registry.register(Product, productComparator)
		expect(registry.has(Person)).toBe(true)
		expect(registry.has(Product)).toBe(true)

		// Act
		registry.clear()

		// Assert
		expect(registry.has(Person)).toBe(false)
		expect(registry.has(Product)).toBe(false)
	})

	test("should get all registered types", () => {
		// Arrange
		registry.register(Person, personComparator)
		registry.register(Product, productComparator)

		// Act
		const registeredTypes = registry.getRegisteredTypes()

		// Assert
		expect(registeredTypes).toHaveLength(2)
		expect(registeredTypes).toContain(Person)
		expect(registeredTypes).toContain(Product)
	})

	test("should work with actual comparison using registered comparator", () => {
		// Arrange
		registry.register(Person, personComparator)
		const person1 = new Person("John", 30)
		const person2 = new Person("John", 30)
		const person3 = new Person("Jane", 25)

		const comparator = registry.get(Person)

		// Act & Assert
		expect(comparator).toBeDefined()
		expect(comparator!.equals(person1, person2)).toBe(true)
		expect(comparator!.equals(person1, person3)).toBe(false)
	})

	test("should overwrite existing comparator when registering same type", () => {
		// Arrange
		const alternativePersonComparator: EqualComparator<Person> = {
			equals: (a: Person, b: Person) => a.name === b.name, // Only compare names
		}

		registry.register(Person, personComparator)
		expect(registry.get(Person)).toBe(personComparator)

		// Act
		registry.register(Person, alternativePersonComparator)

		// Assert
		expect(registry.get(Person)).toBe(alternativePersonComparator)
	})
})

describe("globalEqualComparatorRegistry", () => {
	beforeEach(() => {
		globalEqualComparatorRegistry.clear()
	})

	test("should be accessible globally", () => {
		// Arrange & Act
		globalEqualComparatorRegistry.register(Person, personComparator)

		// Assert
		expect(globalEqualComparatorRegistry.has(Person)).toBe(true)
		expect(globalEqualComparatorRegistry.get(Person)).toBe(personComparator)
	})

	test("should maintain state across different accesses", () => {
		// Arrange
		globalEqualComparatorRegistry.register(Person, personComparator)

		// Act - Access from different variable
		const sameRegistry = globalEqualComparatorRegistry

		// Assert
		expect(sameRegistry.has(Person)).toBe(true)
		expect(sameRegistry.get(Person)).toBe(personComparator)
	})
})
