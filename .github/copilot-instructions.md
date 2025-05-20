# Coding Instructions

- Use arrow functions with the `readonly` modifier for all class methods, including static methods, instead of default class methods.
- Public class methods must always use the `public` modifier.
- For indents use tabs.
- When writing typescript, do not prefix private methods with and underscore. Use private modifier instead.
- Only use ES6 `import {}` and `export` syntax unless instructed otherwise. Do not use `import()` function unless instructed otherwise.
- Never define on your own types, which should already be defined somewhere else.
- When writing code do not use `any` type. If you need to use `any`, please ask for clarification first.
- Wherever possible, instead of copying types or accessing fields on known types, try to import types instead.

# Builder Classes

- Builder classes must accept all mandatory arguments via a single object parameter in the constructor.
- Optional arguments should be set via setter methods that return `this` for method chaining.
- If the constructor provides default values for any arguments, the builder should apply the same defaults.
- In the constructor of a builder class, use inline destructuring syntax, for example: `constructor({ x }: { x: number })` instead of `constructor(params: { x: number })`.
- For default parameters, avoid using `??` or `if`; instead, use inline destructuring with defaults like `constructor({ x = 20 }: { x: number })` where `20` is the default value of `x`.
- Try not to import external types if it's not required. All types for builder class should be provided in target class definition.
- Do not explicitly specify types in class fields. Use `private x` instead of `private x: number` when possible.

# Stored types
- Stored types are used for ensuring that types used in application code can change without affecting serialized data.
- Stored types should support versioning.
- When user asks you to write a stored version of some type, write a proper versioned stored type with appropriate zod schema. Preferrably, do not write type separately, rather use z.infer .
- A serializer class in context of stored types, is one with private constructor, which can perform two operations: serialize and deserialize value from owned to stored version.
- Serializer class may have private functions doing other operations.
- When it comes to stored enums, write copies of them so that values of stored enums can change independently of those of owned enums.
- When writing versioned stored types, also add a type, which has no version in name and can be of any version.
- When writing versioned stored schemas, also add a schema, which has no version in name and can be of any version.
- When defining stored types and schemas ensure that they also use only stored types and schemas.
- When writing serializer classes, try not to use `as any` or `as unknown` casts, unless strictly required or you were asked to do so. 
- If you need to use `as any` or `as unknown`, make sure to add a comment explaining why it's necessary and what the implications are.

# Testing Guidelines

- Use Vitest as the testing framework.
- Always explicitly import testing functions such as `describe` and `test` from `vitest`.
- Ensure that you write comprehensive tests which cover a wide range of code paths and scenarios. Focus on creating advanced, well-designed tests that thoroughly evaluate the functionality, rather than simple or superficial cases.
- When writing test code, try not to use any casts, unless they are required, since that's a bad pattern and you should avoid it.
- Never try to access private members of a class in the test code. If you need to access private members, consider using a public method or property that exposes the necessary functionality.
- When testing, assume that all inputs adhere to typescript types and do not write unit tests for cases when type provided is different than typescript type.
# Monorepo Structure

- This is a rush monorepo. All projects and packages are located in the `packages/` directory at the root of the repository.