import { createAPI } from "./api.ts";
import type { AuthProvider } from "./fetch-types.ts";
import { setupAPIFetch } from "./fetch.ts";

export default defineNuxtPlugin({
  name: "modrinth-api",
  async setup() {
    const fetchAPI = setupAPIFetch();

    let authProvider: AuthProvider | null | undefined;

    const api = {
      ...createAPI(fetchAPI),

      /** A fetch configured specifically for API. */
      $apiFetch: fetchAPI,

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
