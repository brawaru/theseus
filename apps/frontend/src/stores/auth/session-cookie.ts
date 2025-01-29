import { toLimitedSession, type LimitedSession } from "./types.ts";

export function useSessionCookie() {
  const $session = useCookie("auth-session", {
    // TODO: should we at this point just share these parameters?
    maxAge: 60 * 60 * 24 * 365 * 10,
    sameSite: "lax",
    secure: true,
    httpOnly: false,
    path: "/",
    default() {
      return null as LimitedSession | null;
    },
  });

  return computed({
    get: () => $session.value,
    set: (value) => {
      $session.value = value == null ? null : toLimitedSession(value);
    },
  });
}
