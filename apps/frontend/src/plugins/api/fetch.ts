import { type APIFetchOptions, type ResolvedAPIFetchOptions } from "./fetch-types.ts";
import type { paths } from "./schema.d.ts";
import { createTypedFetch } from "./typed-fetch/index.ts";

export function setupAPIFetch(options?: APIFetchOptions) {
  const config = useRuntimeConfig();

  const baseURL = import.meta.server ? config.apiBaseUrl : config.public.apiBaseUrl;

  const headers = Object.create(null);

  return createTypedFetch<paths>({
    baseURL,
    headers,
    ...options,
    onRequest: [
      async function onRequest({ options: _options }) {
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
      },

      ...(Array.isArray(options?.onRequest)
        ? options.onRequest
        : options?.onRequest != null
          ? [options.onRequest]
          : []),
    ],
  });
}
