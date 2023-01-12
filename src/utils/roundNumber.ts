/**
 * Round half up ('round half towards positive infinity')
 * Uses exponential notation to avoid floating-point issues.
 * Negative numbers round differently than positive numbers.
 */
export function round(num: number, decimalPlaces: number) {
  num = Math.round(Number(num + 'e' + decimalPlaces));
  return Number(num + 'e' + -decimalPlaces);
}
