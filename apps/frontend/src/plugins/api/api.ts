import type { $Fetch } from "nitropack";
import type { RouterMethod } from "h3";
import type { NitroFetchOptions } from "nitropack";
import type { paths } from "./schema.d.ts";
import type { Session } from "./types.ts";

type FetchOverrides<M extends RouterMethod> = Omit<
  NitroFetchOptions<string, M>,
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

export function createAPI(fetchAPI: $Fetch<unknown, string>) {
  return {
    getCurrentUser(options?: FetchOverrides<"get">) {
      type Response = paths["/user"]["get"]["responses"][200]["content"]["application/json"];
      return fetchAPI<Response>("/user", options);
    },
    refreshSession(options?: FetchOverrides<"post">) {
      return fetchAPI<Session>("/session/refresh", {
        method: "post",
        ...options,
      });
    },
    deleteSession(id: string, options?: FetchOverrides<"delete">) {
      return fetchAPI<Session>(joinPathParts("/session", id), {
        method: "delete",
        ...options,
      });
    },
    getUser(idOrUsername: string, options?: FetchOverrides<"get">) {
      type Response =
        paths["/user/{id|username}"]["get"]["responses"]["200"]["content"]["application/json"];
      return fetchAPI<Response>(joinPathParts("/user", idOrUsername), options);
    },
  };
}
