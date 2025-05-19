# Coding Instructions

- Use arrow functions with the `readonly` modifier for all class methods, including static methods, instead of default class methods.
- Public class methods must always use the `public` modifier.

# Builder Classes

- Builder classes must accept all mandatory arguments via a single object parameter in the constructor.
- Optional arguments should be set via setter methods that return `this` for method chaining.
- If the constructor provides default values for any arguments, the builder should apply the same defaults.
- In the constructor of a builder class, use inline destructuring syntax, for example: `constructor({ x }: { x: number })` instead of `constructor(params: { x: number })`.
- For default parameters, avoid using `??` or `if`; instead, use inline destructuring with defaults like `constructor({ x = 20 }: { x: number })` where `20` is the default value of `x`.
- Try not to import external types if it's not required. All types for builder class should be provided in target class definition.
- Do not explicitly specify types in class fields. Use `private x` instead of `private x: number` when possible.

# Testing Guidelines

- Use Vitest as the testing framework.
- Always explicitly import testing functions such as `describe` and `test` from `vitest`.
- Ensure that you write comprehensive tests which cover a wide range of code paths and scenarios. Focus on creating advanced, well-designed tests that thoroughly evaluate the functionality, rather than simple or superficial cases.
- When writing test code, try not to use any casts, unless they are required, since that's a bad pattern and you should avoid it.