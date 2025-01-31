export function hydrateMap<Map extends Record<string, () => any>>(
  map: Map,
): {
  [Prop in keyof Map]: ReturnType<Map[Prop]>;
} {
  const initializedMap = Object.create(null);
  for (const [prop, initializer] of Object.entries(map)) {
    initializedMap[prop] = initializer();
  }
  return initializedMap;
}
