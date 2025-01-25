export default defineNuxtPlugin({
  // any plugin that will want to use authenticated API must depend on this module
  name: "modrinth-api-auth",
  dependsOn: ["modrinth-api", "modrinth-auth"],
  setup() {
    const { $modrinthAPI, $modrinthAuth } = useNuxtApp();

    $modrinthAPI.globalAuthProvider = {
      getToken() {
        return $modrinthAuth.session?.session;
      },
    };
  },
});
