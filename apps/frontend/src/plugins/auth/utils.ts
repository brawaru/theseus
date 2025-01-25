import { FetchError } from "ofetch";
import type { LimitedSession } from "./types.ts";

export function didSessionExpire(session: LimitedSession) {
  return Date.now() >= new Date(session.expires).getTime();
}

export function canRefreshSession(session: LimitedSession) {
  return Date.now() <= new Date(session.refresh_expires).getTime();
}

export function isUnauthorizedError(error: unknown): error is FetchError {
  return error instanceof FetchError && error.statusCode === 401;
}
