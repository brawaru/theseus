import { useAuthStore } from "~/stores/auth";

export default defineNuxtPlugin({
  name: "modrinth-auth",
  async setup() {
    await useAuthStore().hydrate({ onError: "logoutInvalid" });
  },
});
