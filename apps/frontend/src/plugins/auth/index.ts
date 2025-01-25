import { setupPlugin as setup } from "./plugin.ts";

export default defineNuxtPlugin({
  name: "modrinth-auth",
  dependsOn: ["modrinth-api"],
  setup,
});
