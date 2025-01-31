import type { AuthProvider } from "./fetch-types.ts";
import { useAPIVersions } from "./versions/index.ts";

export default defineNuxtPlugin({
  name: "modrinth-api",
  async setup() {
    let authProvider: AuthProvider | undefined;

    const versions = useAPIVersions(() => authProvider);

    const api = {
      /** Different versions of the API. */
      versions,

      /**
       * Global authentication provides a value for the `Authorization` headers for all requests
       * that lack one.
       */
      get globalAuthProvider() {
        return authProvider;
      },

      set globalAuthProvider(provider: typeof authProvider) {
        authProvider = provider ?? undefined;
      },
    };

    return { provide: { modrinthAPI: api } };
  },
});
