import type { FetchContext } from "ofetch";
import { type APIFetchOptions, type ResolvedAPIFetchOptions } from "./fetch-types.ts";
import type { paths } from "./schema.d.ts";
import { createTypedFetch } from "./typed-fetch/index.ts";

function pushIntoArray<ItemType>(array: ItemType[], items?: ItemType | ItemType[]) {
  if (items == null) return;
  if (Array.isArray(items)) {
    array.push(...items);
  } else {
    array.push(items);
  }
}

function mergeHooks<HookType>(
  initial: HookType | HookType[],
  other?: HookType | HookType[],
): HookType[] {
  const hooks: HookType[] = [];
  pushIntoArray(hooks, initial);
  pushIntoArray(hooks, other);
  return hooks;
}

export function setupAPIFetch(options?: APIFetchOptions) {
  const config = useRuntimeConfig();

  const baseURL = import.meta.server ? config.apiBaseUrl : config.public.apiBaseUrl;

  async function onRequest({ options: _options }: FetchContext) {
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
  }

  return createTypedFetch<paths>({
    baseURL,
    ...options,
    onRequest: mergeHooks(onRequest, options?.onRequest),
  });
}
