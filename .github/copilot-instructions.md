# Coding Instructions

- Do not create readmes or examples unless explicitly requested.
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
- Do not use `export { ... }` syntax for exporting types, classes, or functions. Instead, use `export class XYZ {}`, `export type XYZ = ...`, or `export function xyz() {}` or `export const a = 42` directly.
- When possible, use enum values instead of literals.

# Stored (Versioned) types

- Stored and Versioned types are the same things. The Versioned name is newer and should be used instead.
- Stored types are used for ensuring that types used in application code can change without affecting serialized data.
- Stored types should support versioning.
 When user asks you to write a stored version of some type, write a proper versioned stored type with appropriate zod schema. Preferrably, do not write type separately, rather use z.infer .
- A serializer class in context of stored types, is one with private constructor, which can perform two operations: serialize and deserialize value from owned to stored version.
- Serializer class may have private functions doing other operations.
- When it comes to stored enums, write copies of them so that values of stored enums can change independently of those of owned enums.
- When writing versioned stored types, also add a type, which has no version in name and can be of any version.
- When writing versioned stored schemas, also add a schema, which has no version in name and can be of any version.
- When defining stored types and schemas ensure that they also use only stored types and schemas.
- When writing serializer classes, try not to use `as any` or `as unknown` casts, unless strictly required or you were asked to do so. 
- Do not use `z.any()` or `z.unknown()` in zod schemas unless explicitly instructed to do so. Instead, use more specific types that accurately represent the data structure.
- When writing unit tests after creating versioned types, write single unit test, which uses `runAllTests` method from `SerializerTester` class from `reserd` library.
- When writing test data serialized data examples, do not use `serialize` method of the serializer class, which is being tested. Instead write objects on your own. You are allowed and should use serialize method for other types, than the one tested.
- Unless instructed otherwise, export only const with versioned type and nothing else. Do not export types or schemas separately.
- As a rule of thumb, there should be single file per versioned/schema type.

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
- If mantine is used in project, prefer mantine breakpoints to fixed custom values.

# UI

When using react-router prefer Link component to using navigate method from useNavigate hook wherever possible.