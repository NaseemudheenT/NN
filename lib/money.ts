/**
 * Money is held in the minor unit (paise) as an integer everywhere.
 * Floats are never used for money: 0.1 + 0.2 !== 0.3, and a rupee lost to
 * binary rounding in a cart total is a real rupee.
 */

export const INR = "INR";

/** 289000 paise → "₹2,890" */
export function formatMinor(minor: number, currency = INR, locale = "en-IN"): string {
  const major = minor / 100;
  const hasPaise = minor % 100 !== 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0,
  }).format(major);
}

/** "2890.00" → 289000 paise, without float drift. */
export function toMinor(amount: string | number): number {
  const s = typeof amount === "number" ? amount.toFixed(2) : amount.trim();
  const [whole, frac = ""] = s.split(".");
  const paise = (frac + "00").slice(0, 2);
  const sign = whole.startsWith("-") ? -1 : 1;
  return sign * (Math.abs(parseInt(whole, 10) || 0) * 100 + (parseInt(paise, 10) || 0));
}

export const sumMinor = (values: number[]) => values.reduce((a, b) => a + b, 0);
