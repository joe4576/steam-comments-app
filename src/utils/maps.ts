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

/**
 * Populate an array of a given type with values of a map where
 * the given value is included in the map's key
 *
 * @param value String value to include in key
 * @param map Map to get values from
 * @returns Array containing map values
 */
export function populateArrayWithValuesFromMap<T>(
  value: string,
  map: Map<string, T[]>
) {
  return [...map.keys()]
    .map((key) => {
      if (key.includes(value.toLowerCase())) {
        return key;
      }
    })
    .filter((key) => !!key)
    .flatMap((key) => map.get(key!) ?? []);
}
