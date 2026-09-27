/**
 * Server-side env access. Nothing here may be imported into a client
 * component — the values are secrets. The only key ever sent to the browser
 * is RAZORPAY_KEY_ID, and it is passed deliberately as a prop.
 */

const read = (key: string) => process.env[key]?.trim() || "";

export const env = {
  get shopifyDomain() { return read("SHOPIFY_STORE_DOMAIN"); },
  get shopifyStorefrontToken() { return read("SHOPIFY_STOREFRONT_TOKEN"); },
  get shopifyAdminToken() { return read("SHOPIFY_ADMIN_TOKEN"); },
  get razorpayKeyId() { return read("RAZORPAY_KEY_ID"); },
  get razorpayKeySecret() { return read("RAZORPAY_KEY_SECRET"); },
  get anthropicKey() { return read("ANTHROPIC_API_KEY"); },
  get supabaseUrl() { return read("SUPABASE_URL"); },
  get supabaseAnonKey() { return read("SUPABASE_ANON_KEY"); },
  get supabaseServiceKey() { return read("SUPABASE_SERVICE_ROLE_KEY"); },
  get ownerEmails() {
    return read("OWNER_EMAILS").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  },
  get siteUrl() { return read("NEXT_PUBLIC_SITE_URL") || "http://localhost:3000"; },
};

/** Which of the given vars are blank. Drives the honest on-page notices. */
export function missing(...keys: string[]): string[] {
  return keys.filter((k) => !read(k));
}

export const shopifyReady = () => !!(env.shopifyDomain && env.shopifyStorefrontToken);
export const razorpayReady = () => !!(env.razorpayKeyId && env.razorpayKeySecret);
export const anthropicReady = () => !!env.anthropicKey;
export const supabaseReady = () => !!(env.supabaseUrl && env.supabaseAnonKey);
