import type { FetchContext } from "ofetch";
import type { ResolvedAPIFetchOptions } from "./fetch-types.ts";

export function useOnRequestHook() {
  const config = useRuntimeConfig();

  return async function onRequest({ options: _options }: FetchContext) {
    const { headers, auth: _auth } = _options as ResolvedAPIFetchOptions;

    if (import.meta.server) {
      headers.set("x-ratelimit-key", config.rateLimitKey);
    }

    if (!headers.has("authorization") && _auth != null) {
      const auth = typeof _auth === "function" ? _auth() : _auth;

      if (auth != null) {
        const token = await auth.getToken();
        if (token != null) headers.set("Authorization", token);
      }
    }
  };
}
