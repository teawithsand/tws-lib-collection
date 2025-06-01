# Coding Instructions

- Use arrow functions with the `readonly` modifier for all class methods, including static methods, instead of default class methods.
- Public class methods must always use the `public` modifier.
- For indents use tabs.
- When writing typescript, do not prefix private methods with and underscore. Use private modifier instead.
- Only use ES6 `import {}` and `export` syntax unless instructed otherwise. Do not use `import()` function unless instructed otherwise.
- Never define on your own types, which should already be defined somewhere else.
- Wherever possible, instead of copying types or accessing fields on known types, try to import types instead.
- If you need to use `as any` or `as unknown`, make sure to add a comment explaining why it's necessary and what the implications are.
- Use SOLID principles when writing code:
    - Single Responsibility: Each class/module should have only one reason to change
    - Open/Closed: Classes should be open for extension but closed for modification
    - Liskov Substitution: Subtypes must be substitutable for their base types
    - Interface Segregation: Prefer many specific interfaces over one general interface
    - Dependency Inversion: Depend on abstractions, not concretions
- Write clean code by:
    - Using meaningful and intention-revealing names
    - Creating small, focused functions that do one thing well
    - Minimizing side effects and maintaining pure functions when possible
    - Following consistent formatting and style conventions
    - Avoiding nested conditionals and deep nesting
    - Writing self-documenting code with appropriate comments only when necessary. Add JSDoc-style comments for all exported functions, classes, and public methods. Use inline comments to explain complex logic or non-obvious decisions.
    - Handling errors and edge cases explicitly
- Follow standard TypeScript naming conventions: `PascalCase` for types, classes, enums, and interfaces; `camelCase` for variables, functions, and methods.
- Prefer `async/await` syntax for handling promises over direct use of `.then()` and `.catch()` chains for improved readability.
- Adhere to the project's ESLint and Prettier configurations. Aim to generate code that would pass their checks.
- Define a consistent error handling strategy. For example, specify whether to use custom error classes, how errors should be logged, or if functions that can fail should return a result type (e.g., `{ success: true, data: T } | { success: false, error: Error }`).
- Do not prefix interfaces with I letter like `IXYZ`. Instead use just `XYZ` in case like that.
# Builder Classes

- Builder classes must accept all mandatory arguments via a single object parameter in the constructor.
- Optional arguments should be set via setter methods that return `this` for method chaining.
- If the constructor provides default values for any arguments, the builder should apply the same defaults.
- In the constructor of a builder class, use inline destructuring syntax, for example: `constructor({ x }: { x: number })` instead of `constructor(params: { x: number })`.
- For default parameters, avoid using `??` or `if`; instead, use inline destructuring with defaults like `constructor({ x = 20 }: { x: number })` where `20` is the default value of `x`.
- Types for the builder's constructor parameters and internal state should be derived directly from the target class's definition (e.g., its constructor arguments or properties) rather than introducing new, builder-specific types for the data it handles. Try not to import external types if it's not required. All types for builder class should be provided in target class definition.
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

# Testing Guidelines

- Use Vitest as the testing framework.
- Always explicitly import testing functions such as `describe` and `test` from `vitest`.
- Ensure that you write comprehensive tests which cover a wide range of code paths and scenarios. Focus on creating advanced, well-designed tests that thoroughly evaluate the functionality, rather than simple or superficial cases. Ensure tests cover:
    - Happy path scenarios.
    - Error handling and failure conditions.
    - Edge cases (e.g., empty inputs, null/undefined where permissible by types, extremely large or small values).
    - Boundary conditions.
    - Interaction between different methods or components, if applicable.
- When writing test code, try not to use any casts, unless they are required, since that's a bad pattern and you should avoid it.
- Never try to access private members of a class in the test code. If you need to access private members, consider using a public method or property that exposes the necessary functionality.
- When testing, assume that all inputs adhere to typescript types and do not write unit tests for cases when type provided is different than typescript type.
- Use Arrange Act Assert (AAA) pattern for structuring tests:
    - Arrange: Set up the necessary preconditions and inputs.
    - Act: Execute the code under test.
    - Assert: Verify that the expected outcomes occur.
- Prefer more smaller unit tests, to fewer larger tests. Each test should ideally focus on a single aspect of the functionality being tested.

# Monorepo Structure

- This is a rush monorepo. All projects and packages are located in the `packages/` directory at the root of the repository.

# CSS
- Do not use inline styles in React components and HTML files.
- Use CSS modules for styling React components. Make sure modular file names end with `.module.css` or `.module.scss`.
- Prefer SASS over CSS for styling React components. Use `.scss` file extension for SASS files.
- Use BEM (Block Element Modifier) naming convention for CSS classes.