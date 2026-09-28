/**
 * Server-only environment access.
 * Secrets are read here and never leave the server.
 */
import "server-only";

function read(name: string): string | null {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v.trim() : null;
}

export const env = {
  shopifyDomain: () => read("SHOPIFY_STORE_DOMAIN"),
  shopifyStorefrontToken: () => read("SHOPIFY_STOREFRONT_TOKEN"),
  shopifyAdminToken: () => read("SHOPIFY_ADMIN_TOKEN"),
  razorpayKeyId: () => read("RAZORPAY_KEY_ID"),
  razorpayKeySecret: () => read("RAZORPAY_KEY_SECRET"),
  anthropicKey: () => read("ANTHROPIC_API_KEY"),
  supabaseUrl: () => read("SUPABASE_URL"),
  supabaseAnonKey: () => read("SUPABASE_ANON_KEY"),
  supabaseServiceKey: () => read("SUPABASE_SERVICE_ROLE_KEY"),
  ownerEmails: () =>
    (read("OWNER_EMAILS") ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  siteUrl: () => read("NEXT_PUBLIC_SITE_URL") ?? "https://nn-pi-opal.vercel.app",
};

export const integrations = {
  shopify: () => Boolean(env.shopifyDomain() && env.shopifyStorefrontToken()),
  shopifyAdmin: () => Boolean(env.shopifyDomain() && env.shopifyAdminToken()),
  razorpay: () => Boolean(env.razorpayKeyId() && env.razorpayKeySecret()),
  anthropic: () => Boolean(env.anthropicKey()),
  supabase: () => Boolean(env.supabaseUrl() && env.supabaseAnonKey()),
};
