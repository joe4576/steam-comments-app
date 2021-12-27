/**
 * Check whether a string contains only digits
 * @param stringToCheck Input string
 * @returns True if the string only consists of digits, false if any non-didget is found
 */
export const doesStringOnlyContainNumbers = (
  stringToCheck: string
): boolean => {
  return /^\d+$/.test(stringToCheck);
};
