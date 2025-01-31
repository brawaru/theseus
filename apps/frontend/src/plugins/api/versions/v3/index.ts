import type { APIConfig } from "../../plugin-types.ts";

export function createAPI({ apiBaseURL, fetchOpts }: APIConfig) {
  const $apiFetch = $fetch.create<unknown, string>({
    ...fetchOpts,
    baseURL: new URL("v3/", apiBaseURL).toString(),
  });

  return {
    $apiFetch,
    methods: {},
  };
}
