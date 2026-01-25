/**
 * @fileoverview Shared type definitions
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 */

/**
 * Make all properties of T mutable (remove readonly).
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Deep partial type - all properties optional recursively.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extract keys of T that have values of type V.
 */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * Require at least one of the properties.
 */
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

/**
 * Simple 2D vector.
 */
export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Rectangle bounds.
 */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Result type for operations that can fail.
 */
export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

/**
 * Create a success result.
 */
export function ok<T>(value: T): Result<T, never> {
  return { success: true, value };
}

/**
 * Create a failure result.
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}
