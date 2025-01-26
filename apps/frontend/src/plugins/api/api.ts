import type { NitroFetchOptions } from "nitropack";
import type { paths } from "./schema.d.ts";
import type { TypedFetch } from "./typed-fetch/index.ts";
import type { NewSession, Session } from "./types.ts";

type FetchOverrides = Omit<
  NitroFetchOptions<string, any>,
  "method" | "baseURL" // you can, of course, "as any" this bad boy, but why?
>;

/**
 * Joins parts of an URI path through `URL` API, which ensures that the path is properly encoded.
 *
 * Each part is interpreted separately, therefore any relative parts are intepreted relatively to
 * themselves, thus `..` is `/` and `a/b/c/../d` is `/a/b/d`. Empty parts are skipped.
 *
 * @param parts Parts that make the `pathname`.
 * @returns `pathname` after all parts were concatenated.
 */
function joinPathParts(...parts: string[]) {
  const fakeURL = new URL("dummy-proto://");
  let result = "";
  for (const part of parts) {
    if (part.length === 0) continue;
    fakeURL.pathname = part;
    result += fakeURL.pathname;
  }
  return result;
}

export function createAPI(fetchAPI: TypedFetch<paths>) {
  fetchAPI("/project/{id|slug}", {
    path: { "id|slug": "sodium" },
    method: "patch",
    body: {},
  });

  return {
    getCurrentUser(options?: FetchOverrides) {
      return fetchAPI("/user", options);
    },
    getAllSessions(options?: FetchOverrides) {
      return fetchAPI.base<Session[]>("/session/list", options);
    },
    refreshSession(options?: FetchOverrides) {
      return fetchAPI.base<NewSession>("/session/refresh", {
        method: "post",
        ...options,
      });
    },
    deleteSession(id: string, options?: FetchOverrides) {
      return fetchAPI.base(joinPathParts("/session", id), {
        method: "delete",
        ...options,
      });
    },
    getUser(idOrUsername: string, options?: FetchOverrides) {
      return fetchAPI("/user/{id|username}", {
        path: { "id|username": idOrUsername },
        ...options,
      });
    },
  };
}
