import { useOnRequestHook } from "../fetch-hooks.ts";
import type { AuthProvider } from "../fetch-types.ts";
import type { APIConfig } from "../plugin-types.ts";
import { hydrateMap } from "../utils.ts";
import { createAPI as createInternalAPI } from "./internal/index.ts";
import { createAPI as createV2API } from "./v2/index.ts";
import { createAPI as createV3API } from "./v3/index.ts";

export function useAPIVersions(auth: () => AuthProvider | undefined) {
  const config = useRuntimeConfig();
  const onRequest = useOnRequestHook();

  const apiConfig: APIConfig = {
    apiBaseURL: (import.meta.server ? config.apiServerUrl : config.public.apiServerUrl) as string,
    fetchOpts: { onRequest, auth },
  };

  return hydrateMap({
    v2: createV2API.bind(null, apiConfig),
    v3: createV3API.bind(null, apiConfig),
    internal: createInternalAPI.bind(null, apiConfig),
  });
}

export type APIVersionsMap = ReturnType<typeof useAPIVersions>;
