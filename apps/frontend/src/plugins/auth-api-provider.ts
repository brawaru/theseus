export default defineNuxtPlugin({
  // any plugin that will want to use authenticated API must depend on this module
  name: "modrinth-api-auth",
  dependsOn: ["modrinth-api", "modrinth-auth"],
  setup() {
    const { $modrinthAPI, $pinia } = useNuxtApp();
    const session = toRef(useAuthStore($pinia), "session");

    $modrinthAPI.globalAuthProvider = {
      getToken() {
        return session.value?.session;
      },
    };
  },
});
