export function useNewAuth() {
  const { $modrinthAuth } = useNuxtApp();

  return $modrinthAuth;
}
