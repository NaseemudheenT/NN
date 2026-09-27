/** NERO NOREN — the shape every part of the site reads products in. */

export type GarmentType = "shirt" | "trouser";
export type GarmentStyle = "oxford" | "poplin" | "flat" | "pleat";

export interface SizeRow {
  /** Size label as the customer sees it: "M", "32". */
  label: string;
  /** Body measurements the size is cut to fit, centimetres. */
  body: { chest?: [number, number]; waist?: [number, number]; hip?: [number, number] };
  /** Finished garment measurements, centimetres. Ease = garment − body. */
  garment: {
    chest?: number;
    waist?: number;
    hip?: number;
    shoulder?: number;
    sleeve?: number;
    thigh?: number;
    inseam?: number;
    length?: number;
  };
}

export interface SizeChart {
  type: GarmentType;
  unit: "cm";
  rows: SizeRow[];
}

export interface Variant {
  id: string;
  size: string;
  available: boolean;
  /** Price in paise, so money is never a float. */
  priceMinor: number;
  currency: string;
}

export interface Product {
  /** URL handle and stable id. */
  handle: string;
  title: string;
  /** "The Oxford" — the cut, without the colour. */
  name: string;
  colour: string;
  type: GarmentType;
  style: GarmentStyle;
  /** Cloth colour, used by the 2D art and the 3D garment placeholder. */
  hex: string;
  /** Woven stripe colour, when the cloth is striped. */
  stripe?: string;
  description: string;
  fabric: string;
  care: string;
  bestFor: string;
  /** Price in paise. */
  priceMinor: number;
  currency: string;
  variants: Variant[];
  sizeChart: SizeChart;
  /** Shopify metafield nn.model_glb — path under /public/models. */
  modelGlb?: string;
  /** Shopify metafield nn.fit_notes — the brand's own words on how it wears. */
  fitNotes?: string;
  /** Where the piece sits in the showroom: a rail, the table, a mannequin. */
  placement: "rail-a" | "rail-b" | "table" | "mannequin-1" | "mannequin-2";
  images: { url: string; alt: string }[];
  /** True when this came from the seed rather than Shopify. */
  isSeed?: boolean;
}

export interface CatalogueResult {
  products: Product[];
  /** "shopify" when live, "seed" when falling back. */
  source: "shopify" | "seed";
  /** Env vars that were missing, for the on-page notice. */
  missingEnv: string[];
}
