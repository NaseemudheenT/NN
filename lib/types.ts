export type Category = "shirts" | "trousers" | "outerwear" | "knitwear";

export interface Money {
  amount: number;
  currency: string;
}

export interface ProductImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface Variant {
  id: string;
  size: string;
  available: boolean;
  price: Money | null;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  /** Colourway name as the house uses it, e.g. Bianco */
  colour: string;
  /** Hex the 3D garment and the swatch use */
  swatch: string;
  category: Category;
  fabric: string;
  fit: string;
  description: string;
  care: string[];
  sizes: string[];
  price: Money | null;
  images: ProductImage[];
  /** Path under /public/models when a real garment model exists */
  modelGlb: string | null;
  variants: Variant[];
  /**
   * True when this entry is a showroom display form — the garment exists
   * in Collection 001, but price, stock and photography come from Shopify
   * and are not yet connected. Nothing here is invented.
   */
  preview: boolean;
  /** Ease in cm at chest / waist / hip per size, when published */
  sizeChart: Record<string, { chest?: number; waist?: number; hip?: number; inseam?: number }> | null;
}

export interface Catalog {
  configured: boolean;
  source: "shopify" | "preview";
  products: Product[];
  /** Set when Shopify is configured but the request failed */
  error: string | null;
}

export interface CartLine {
  variantId: string;
  handle: string;
  title: string;
  colour: string;
  size: string;
  quantity: number;
  price: Money | null;
  image: string | null;
}
