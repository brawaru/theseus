import type { APIVersionsMap } from "~/plugins/api/versions";

export function useModrinthAPI<APIVersion extends keyof APIVersionsMap>(
  version: APIVersion,
): APIVersionsMap[APIVersion] {
  return useNuxtApp().$modrinthAPI.versions[version];
}
