import { FetchError } from "ofetch";

export class NoSessionError extends Error {}

export class APIError extends Error {
  constructor(message: string, options?: ErrorOptions & { cause?: FetchError }) {
    super(message, options);
    this.cause = options?.cause;
  }

  #isOfCode(statusCode: number) {
    const cause = this.cause as FetchError;
    return cause.statusCode === statusCode;
  }

  get isUnauthorized() {
    return this.#isOfCode(401);
  }

  get isNotFound() {
    return this.#isOfCode(404);
  }

  get isServerError() {
    return this.#isOfCode(500);
  }
}

/**
 * Wraps a causing error into a relevant wrapper error with a specific message, keeping the original
 * error message. For example, {@link FetchError}s will be wrapped into {@link APIError}.
 *
 * @param cause Causing error.
 * @param message Message for the wrapping error.
 * @returns An appropriate wrapper error, that has the original error as its cause.
 */
export function wrapError(cause: unknown, message: string) {
  return cause instanceof FetchError
    ? new APIError(message, { cause })
    : new Error(message, { cause });
}
