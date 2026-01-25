/**
 * @fileoverview Runtime assertion utilities
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/QUALITY_GATES.md - Error handling
 */

/**
 * Check if running in development mode.
 */
const isDev = (): boolean => {
  try {
    return import.meta.env?.DEV ?? false;
  } catch {
    return false;
  }
};

/**
 * Assert that a condition is true.
 * Throws in development, logs error in production.
 *
 * @param condition - Condition to check
 * @param message - Error message if condition is false
 * @throws Error in development if condition is false
 */
export function assert(
  condition: boolean,
  message: string
): asserts condition {
  if (!condition) {
    const error = new Error(`Assertion failed: ${message}`);

    if (isDev()) {
      throw error;
    } else {
      console.error(error);
    }
  }
}

/**
 * Assert that a value is not null or undefined.
 *
 * @param value - Value to check
 * @param message - Error message if value is nullish
 * @returns The value (typed as non-null)
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message: string
): T {
  // eslint-disable-next-line eqeqeq
  assert(value != null, message);
  return value;
}

/**
 * Assert that code should never be reached.
 * Useful for exhaustive switch statements.
 *
 * @param value - Value that should be of type never
 * @param message - Optional message
 */
export function assertNever(value: never, message?: string): never {
  throw new Error(
    message ?? `Unexpected value: ${JSON.stringify(value)}`
  );
}

/**
 * Assert that a value is a specific type.
 *
 * @param value - Value to check
 * @param check - Type check function
 * @param message - Error message
 */
export function assertType<T>(
  value: unknown,
  check: (v: unknown) => v is T,
  message: string
): asserts value is T {
  assert(check(value), message);
}
