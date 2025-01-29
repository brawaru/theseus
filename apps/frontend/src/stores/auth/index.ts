import type { User } from "~/plugins/api/types.ts";
import { APIError, NoSessionError, wrapError } from "./errors.ts";
import { useSessionCookie } from "./session-cookie.ts";
import type { OnRefreshErrorValue } from "./types.ts";
import { didSessionExpire } from "./utils.ts";

export const useAuthStore = defineStore("auth", () => {
  const $oldToken = useCookie("auth-token", {
    maxAge: 60 * 60 * 24 * 365 * 10,
    sameSite: "lax",
    secure: true,
    httpOnly: false,
    path: "/",
    default() {
      return null as string | null;
    },
  });

  const $canMigrate = computed(() => $oldToken.value != null);

  const $session = useSessionCookie();

  const $user = useState<User | null>("auth/user", () => null);

  const $api = useNuxtApp().$modrinthAPI;

  function getSessionOrThrow(message: string) {
    const session = $session.value;
    if (session == null) throw new NoSessionError(message);
    return session;
  }

  /**
   * Refreshes the user data for the current session.
   *
   * @throws {NoSessionError} If there is no current session.
   * @throws {APIError} If an API error occurs during data refresh.
   */
  async function refreshUser() {
    const session = getSessionOrThrow("Cannot refresh user data without an active session");

    try {
      $user.value = await $api.getCurrentUser({
        headers: { authorization: session.session },
      });
    } catch (err) {
      throw wrapError(err, "Unable to refresh the user data");
    }
  }

  /**
   * Retrieves the current session from the list of the active sessions.
   *
   * This is a workaround due to the lack of API method to retrieve the current session.
   *
   * @param token Token used to retrieve the list of all sessions.
   * @returns Current session from the list of sessions with `session` property assigned to the
   *   token, which was used to retrieve the list.
   * @throws {APIError} If unable to retrieve the list of sessions.
   * @throws {Error} If none of sessions in the list is "current".
   */
  async function getCurrentSession(token: string) {
    let sessions;
    try {
      sessions = await $api.getAllSessions({
        headers: { authorization: token },
      });
    } catch (err) {
      throw wrapError(err, "Unable to get list of active sessions");
    }

    const currentSession = sessions.find(({ current }) => current);

    if (currentSession == null) {
      throw new Error("Unable to find current session in the list of sessions");
    }

    return Object.assign({ ...currentSession }, { session: token });
  }

  /**
   * Validates the session for the provided token, or attempts to automatically refresh it on
   * failure (according to options). Saves the new session on success, replacing any previous
   * session, and deleting any old unmigrated token from before authorization rewrite.
   *
   * This does not refresh the user data.
   *
   * @param token Token that will be used to refresh the session.
   * @throws {APIError} If the session cannot be validated or refreshed due to error from API.
   * @throws {Error} If there was an error during the validation of the session.
   */
  async function login(
    token: string,
    options?: {
      /**
       * Whether the attempt must be made to refresh the session if its initial validation was not
       * successful.
       *
       * @default true
       */
      autoRefresh?: boolean;
    },
  ) {
    const shouldAutoRefresh = options?.autoRefresh ?? true;

    let session;

    try {
      session = await getCurrentSession(token);
    } catch (err) {
      if (shouldAutoRefresh && err instanceof APIError && err.isUnauthorized) {
        try {
          session = await $api.refreshSession({
            headers: { Authorization: token },
          });
        } catch (refreshErr) {
          throw wrapError(refreshErr, "Unable to neither validate nor refresh the session");
        }
      }

      throw wrapError(err, "Unable to validate the session");
    }

    $session.value = session;
    $oldToken.value = null;
  }

  /**
   * Sends a request to terminate session, and clears any session and data on success or if
   * `throwOnTerminationFail` is set to `false`.
   *
   * @param throwOnTerminationFail Whether to throw if the session cannot be terminated.
   * @throws {APIError} If `throwOnTerminationFail` is set to `true`, and session cannot be
   *   terminated.
   */
  async function logout(throwOnTerminationFail = false) {
    if ($session.value != null) {
      try {
        await $api.deleteSession($session.value.id);
      } catch (cause) {
        if (throwOnTerminationFail) {
          throw wrapError(cause, "Unable to terminate current session");
        }
      }

      $session.value = null;
    }

    $user.value = null;
  }

  function handleLogoutOnError(error: unknown, handling: OnRefreshErrorValue) {
    if (
      handling === "logout" ||
      (handling === "logoutInvalid" && error instanceof APIError && error.isUnauthorized)
    ) {
      return logout(false);
    }

    throw error;
  }

  /**
   * If `canMigrate` is `true`, then refreshes the session for the old token, and saves it, clearing
   * old token in the process.
   *
   * @param options Options, such as error handling.
   * @throws {Error} If no previous token is stored (can be checked using `canMigrate` property).
   * @throws {APIError} Based on `options.onError` option, see {@link OnRefreshErrorValue} for more
   *   details.
   */
  async function migrate(options?: {
    /**
     * Defines whether the log out should happen if an error occurs when attempting to refresh the
     * session for the old token. See {@link OnRefreshErrorValue} for more information about the
     * values. Default is `"logoutInvalid"`.
     */
    onError?: OnRefreshErrorValue;
  }) {
    const onError = options?.onError ?? "logoutInvalid";

    if ($oldToken.value == null) {
      throw new Error("No old token saved to migrate");
    }

    try {
      await login($oldToken.value);

      $oldToken.value = null;
    } catch (err) {
      return handleLogoutOnError(err, onError);
    }
  }

  /**
   * Refreshes the current session and accordingly handles any errors in the process.
   *
   * @param options Options, such as error handling.
   * @throws {NoSessionError} If there is no current session.
   * @throws {APIError} Based on `options.onError` option, see {@link OnRefreshErrorValue} for more
   *   details.
   */
  async function refreshSession(options?: {
    /**
     * Defines whether the log out should happen if an error occurs when attempting to refresh the
     * session. See {@link OnRefreshErrorValue} for information about the values. Default is
     * `"logoutInvalid"`.
     */
    onError?: OnRefreshErrorValue;
  }) {
    const onError = options?.onError ?? "logoutInvalid";

    const { session } = getSessionOrThrow(
      "Unable to refresh the session without an active session",
    );

    try {
      await login(session);
    } catch (err) {
      return handleLogoutOnError(err, onError);
    }
  }

  /**
   * Ensures that if there is a saved session, it is recently refreshed, and the user data related
   * to that session is refreshed as well. If there is an old token, it will be migrated during the
   * call. If there's an authorization error during the user data fetching, an attempt to forcefully
   * refresh session will be made, and then handled accordingly.
   *
   * @param options Options, such as error handling.
   * @throws {UnauthorizedError} If session cannot be refreshed because it's invalid and
   *   `options.onError` is set to "throw".
   * @throws {APIError} If session cannot be refreshed because it's invalid and options.onError is
   *   set to "throw".
   * @throws {Error} If unable to retriev
   */
  async function hydrate(options?: {
    /**
     * Defines whether the log out should happen if an error occurs during initialization. See
     * {@link OnRefreshErrorValue} for information about the values. Default is `"logoutInvalid"`.
     */
    onError: OnRefreshErrorValue;
  }) {
    const onError = options?.onError ?? "logoutInvalid";

    if ($session.value == null && $oldToken.value == null) return;

    if ($oldToken.value != null) await migrate({ onError });

    // we might have logged out upon migration because our token expired
    if ($session.value == null) return;

    let forcefullyRefresh = false;

    while (true) {
      if (forcefullyRefresh || didSessionExpire($session.value)) {
        await refreshSession({ onError });
      }

      if ($session.value == null) return;

      if ($user.value == null) {
        try {
          await refreshUser();
          break;
        } catch (err) {
          if (!forcefullyRefresh && err instanceof APIError && err.isUnauthorized) {
            forcefullyRefresh = true;
            continue;
          }

          // if we already refreshed, or the error is not related to auth, there
          // is no point to refresh session, so we should just handle log out
          // according to the options
          return handleLogoutOnError(err, onError);
        }
      }
    }
  }

  return {
    /**
     * Data of the authorized user.
     *
     * `null` if not signed in or fetched.
     */
    user: $user,
    /**
     * Current authorization session.
     *
     * `null` if not signed in.
     */
    session: $session,
    /** Whether an old cookie tokie is present that can be migrated. */
    canMigrate: $canMigrate,
    migrate,
    login,
    logout,
    refreshUser,
    refreshSession,
    hydrate,
  };
});
