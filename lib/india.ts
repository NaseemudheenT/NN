/**
 * Indian address handling.
 *
 * The PIN code check is real, not a six-digit regex: the first digit is the
 * postal region and 0 is not one, so 0xxxxx cannot exist. The first two digits
 * identify the postal circle, which lets us name the state without a lookup
 * table of thirty thousand post offices — and lets us say "that PIN is not in
 * Kerala" when someone mistypes.
 */

export const PIN_PATTERN = /^[1-9][0-9]{5}$/;

/** First two digits of a PIN → the postal circle it belongs to. */
const CIRCLES: [number, number, string][] = [
  [11, 11, "Delhi"],
  [12, 13, "Haryana"],
  [14, 16, "Punjab"],
  [17, 17, "Himachal Pradesh"],
  [18, 19, "Jammu and Kashmir"],
  [20, 28, "Uttar Pradesh and Uttarakhand"],
  [30, 34, "Rajasthan"],
  [36, 39, "Gujarat"],
  [40, 44, "Maharashtra"],
  [45, 49, "Madhya Pradesh and Chhattisgarh"],
  [50, 53, "Telangana and Andhra Pradesh"],
  [56, 59, "Karnataka"],
  [60, 66, "Tamil Nadu"],
  [67, 69, "Kerala"],
  [70, 74, "West Bengal"],
  [75, 77, "Odisha"],
  [78, 78, "Assam"],
  [79, 79, "North Eastern states"],
  [80, 85, "Bihar and Jharkhand"],
];

export function circleForPin(pin: string): string | null {
  if (!PIN_PATTERN.test(pin)) return null;
  const prefix = Number(pin.slice(0, 2));
  return CIRCLES.find(([lo, hi]) => prefix >= lo && prefix <= hi)?.[2] ?? null;
}

export function validatePin(pin: string): { ok: boolean; message?: string; circle?: string } {
  const trimmed = pin.trim();
  if (!trimmed) return { ok: false, message: "Enter your PIN code." };
  if (!/^\d+$/.test(trimmed)) return { ok: false, message: "A PIN code is six digits." };
  if (trimmed.length !== 6) return { ok: false, message: "A PIN code is six digits." };
  if (trimmed.startsWith("0")) {
    return { ok: false, message: "No Indian PIN code starts with a zero." };
  }
  const circle = circleForPin(trimmed);
  if (!circle) {
    return { ok: false, message: "We do not recognise that PIN code. Please check it." };
  }
  return { ok: true, circle };
}

/** Indian mobile numbers start 6, 7, 8 or 9 and are ten digits. */
export function validateMobile(value: string): { ok: boolean; message?: string; normalised?: string } {
  const digits = value.replace(/[^\d]/g, "").replace(/^(0|91)/, "");
  if (!digits) return { ok: false, message: "Enter a mobile number." };
  if (digits.length !== 10) return { ok: false, message: "An Indian mobile number is ten digits." };
  if (!/^[6-9]/.test(digits)) {
    return { ok: false, message: "An Indian mobile number starts with 6, 7, 8 or 9." };
  }
  return { ok: true, normalised: `+91${digits}` };
}

/**
 * Delivery estimate.
 *
 * Honest about being an estimate, and built from something real: distance by
 * postal circle from where NN dispatches, plus the day of the week, since
 * nothing leaves on a Sunday. It never promises a date — it gives a window.
 */
const DISPATCH_CIRCLE = "Kerala"; // NN dispatches from Kerala

const METRO_CIRCLES = new Set([
  "Delhi",
  "Maharashtra",
  "Karnataka",
  "Tamil Nadu",
  "Telangana and Andhra Pradesh",
  "West Bengal",
  "Kerala",
]);

export interface DeliveryEstimate {
  minDays: number;
  maxDays: number;
  /** A sentence for the customer. */
  text: string;
  circle: string | null;
}

export function estimateDelivery(pin: string, from: Date = new Date()): DeliveryEstimate | null {
  const circle = circleForPin(pin);
  if (!circle) return null;

  let minDays: number;
  let maxDays: number;
  if (circle === DISPATCH_CIRCLE) {
    minDays = 2;
    maxDays = 3;
  } else if (METRO_CIRCLES.has(circle)) {
    minDays = 3;
    maxDays = 5;
  } else if (circle === "North Eastern states" || circle === "Jammu and Kashmir") {
    minDays = 6;
    maxDays = 9;
  } else {
    minDays = 4;
    maxDays = 7;
  }

  // Orders placed after 2pm, or at the weekend, go out the next working day.
  const late = from.getHours() >= 14;
  const day = from.getDay();
  const weekendDelay = day === 0 ? 1 : day === 6 ? 2 : 0;
  const handling = (late ? 1 : 0) + weekendDelay;

  minDays += handling;
  maxDays += handling;

  const format = (days: number) => {
    const d = new Date(from);
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  };

  return {
    minDays,
    maxDays,
    circle,
    text: `Estimated delivery to ${circle} between ${format(minDays)} and ${format(maxDays)}.`,
  };
}
