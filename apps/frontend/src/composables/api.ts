import type { UseFetchOptions } from "#app";

export function useModrinthAPI() {
  return useNuxtApp().$modrinthAPI;
}

export function useModrinthFetch<T>(
  url: string | (() => string),
  options: Omit<UseFetchOptions<T>, "$fetch"> = {},
) {
  const { $fetch } = useModrinthAPI();
  return useFetch(url, { ...options, $fetch: $fetch.base });
}
