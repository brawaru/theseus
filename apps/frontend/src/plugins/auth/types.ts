import type { Session } from "~/plugins/api/types.ts";

/**
 * Defines what happens when an error occurs during session refresh or migration.
 *
 * One of the following:
 *
 * - `"logout"` - log out on any error;
 * - `"logoutInvalid"` - log out only if session cannot be refreshed, throw for other errors;
 * - `"throw"` - throw for any error.
 *
 * It must be noted that the log out that happens due to an error will not produce an error if the
 * current session cannot be terminated.
 */
export type OnRefreshErrorValue = "logout" | "logoutInvalid" | "throw";

export type LimitedSession = Pick<
  Session,
  "session" | "id" | "expires" | "refresh_expires" | "created"
>;

/**
 * From a {@link LimitedSession}-like object picks up only those properties that belong to
 * {@link LimitedSession}. This ensures that only the relevant data is stored in the cookie.
 *
 * @param value Object with a shape siilar to {@link LimitedSession}.
 * @returns Object that only has properties of {@link LimitedSession}.
 */
export function toLimitedSession(value: LimitedSession) {
  const { id, session, created, expires, refresh_expires } = value;
  return { id, session, created, expires, refresh_expires };
}
