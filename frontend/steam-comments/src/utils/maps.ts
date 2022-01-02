/**
 * If key exists in a map, push the value to the corresponding array. If
 * the key doesn't exist, set the new key and value.
 *
 * @param key Map key
 * @param value Map value
 * @param map Map itself
 */
export function pushKeyToArrayMap<T>(
  key: string,
  value: T,
  map: Map<string, T[]>
): void {
  map.get(key) ? map.get(key)!.push(value) : map.set(key, [value]);
}
