"use client";

import { useMemo, useState } from "react";
import * as THREE from "three";
import { garmentShape, hangerGeometry, seeded } from "@/components/showroom/geometry";
import { cloth, type Materials } from "@/components/showroom/materials";
import { markTexture } from "./mark-texture";
import { B, PLINTHS, RAILS, type RailSpec } from "./plan";
import type { Product } from "@/lib/catalog/types";

/**
 * The stock.
 *
 * Every garment on every rail is a real catalogue product — click one and
 * you are looking at the thing you can buy, in the colour the catalogue
 * says, with the price the catalogue says. There is no decorative clothing
 * in this building; a rail of invented garments beside a rail of real ones
 * teaches a customer not to trust either.
 *
 * ── the brand on the cloth ──────────────────────────────────────────
 * Each piece carries the NN mark the way the real garment does: a woven
 * neck label inside the collar. It is the SAME path the header logo is
 * drawn from, baked to a texture — so when the Founder's own photographs
 * replace these, the mark the customer saw in the showroom is the mark on
 * the garment that arrives.
 */

interface Hanging {
  key: string;
  product: Product;
  z: number;
  long: boolean;
  yaw: number;
  tilt: number;
}

function Rail({
  spec,
  products,
  m,
  onPick,
  picked,
}: {
  spec: RailSpec;
  products: Product[];
  m: Materials;
  onPick: (p: Product, world: THREE.Vector3) => void;
  picked: string | null;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const bar = 1.78;
  const y = spec.floor * B.gallery.y;

  const coat = useMemo(() => garmentShape(1.18, 0.54, 0.62), []);
  const shirt = useMemo(() => garmentShape(0.82, 0.47, 0.51), []);
  const hanger = useMemo(() => hangerGeometry(0.54), []);
  const label = useMemo(() => markTexture(), []);

  /* Deterministic: the same rail, in the same order, on every visit. A shop
     whose stock rearranges itself between visits is a shop nobody learns. */
  const hanging = useMemo<Hanging[]>(() => {
    if (!products.length) return [];
    const rnd = seeded(Math.round((spec.x + 20) * 997 + (spec.z + 40) * 31));
    const n = Math.max(5, Math.min(14, Math.floor(spec.length / 0.3)));
    return Array.from({ length: n }, (_, i) => {
      const product = products[i % products.length];
      return {
        key: `${spec.id}-${i}`,
        product,
        z: spec.z - spec.length / 2 + 0.2 + (i * (spec.length - 0.4)) / Math.max(1, n - 1),
        long: product.type === "trouser" ? false : rnd() > 0.5,
        yaw: (rnd() - 0.5) * 0.16,
        tilt: (rnd() - 0.5) * 0.05,
      };
    });
  }, [spec, products]);

  return (
    <group>
      {/* the rail: champagne-gold tube on two black posts */}
      {[spec.z - spec.length / 2, spec.z + spec.length / 2].map((pz) => (
        <group key={pz} position={[spec.x, y, pz]}>
          <mesh position={[0, bar / 2 + 0.06, 0]} material={m.blackMetal} castShadow>
            <cylinderGeometry args={[0.03, 0.038, bar + 0.12, 12]} />
          </mesh>
          <mesh position={[0, 0.025, 0]} material={m.blackMetal} castShadow receiveShadow>
            <cylinderGeometry args={[0.22, 0.26, 0.05, 20]} />
          </mesh>
        </group>
      ))}
      <mesh
        position={[spec.x, y + bar + 0.12, spec.z]}
        rotation-x={Math.PI / 2}
        material={m.gold}
        castShadow
      >
        <cylinderGeometry args={[0.024, 0.024, spec.length, 14]} />
      </mesh>

      {hanging.map((h) => {
        const on = hover === h.key || picked === h.product.handle;
        return (
          <group
            key={h.key}
            position={[spec.x, y + bar + 0.1, h.z]}
            rotation-y={h.yaw}
            rotation-z={h.tilt}
            onPointerOver={(e) => { e.stopPropagation(); setHover(h.key); document.body.style.cursor = "pointer"; }}
            onPointerOut={() => { setHover(null); document.body.style.cursor = ""; }}
            onClick={(e) => {
              e.stopPropagation();
              const world = new THREE.Vector3();
              e.eventObject.getWorldPosition(world);
              onPick(h.product, world);
            }}
          >
            <mesh geometry={hanger} material={m.gold} />
            <mesh
              geometry={h.long ? coat : shirt}
              position={[0, -0.03, on ? 0.06 : 0]}
              material={cloth(h.product.hex)}
              castShadow
              receiveShadow
            />
            {/* the woven neck label, inside the collar */}
            <mesh position={[0, -0.15, -0.055]} rotation-x={0.1}>
              <planeGeometry args={[0.1, 0.055]} />
              <meshStandardMaterial map={label} roughness={0.9} side={THREE.DoubleSide} />
            </mesh>
            {/* a quiet halo when the piece is under the pointer */}
            {on ? (
              <mesh position={[0, -0.55, -0.1]}>
                <planeGeometry args={[0.95, 1.5]} />
                <meshBasicMaterial color="#f7f5ef" transparent opacity={0.07} depthWrite={false} />
              </mesh>
            ) : null}
          </group>
        );
      })}
    </group>
  );
}

/** A mannequin on its plinth, wearing one piece. Also pickable. */
function Plinth({
  x,
  z,
  floor,
  product,
  m,
  onPick,
}: {
  x: number;
  z: number;
  floor: number;
  product?: Product;
  m: Materials;
  onPick: (p: Product, world: THREE.Vector3) => void;
}) {
  const [hover, setHover] = useState(false);
  const y = floor * B.gallery.y;
  const body = useMemo(() => garmentShape(1.1, 0.56, 0.66), []);

  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.1, 0]} material={m.marbleLight} castShadow receiveShadow>
        <cylinderGeometry args={[0.52, 0.56, 0.2, 40]} />
      </mesh>
      <mesh position={[0, 0.55, 0]} material={m.blackMetal} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.72, 12]} />
      </mesh>
      {/* torso, shoulders, neck — abstract on purpose; a face would be a face */}
      <mesh position={[0, 1.3, 0]} material={m.plaster} castShadow receiveShadow>
        <capsuleGeometry args={[0.21, 0.54, 6, 18]} />
      </mesh>
      <mesh position={[0, 1.57, 0]} rotation-z={Math.PI / 2} material={m.plaster} castShadow>
        <capsuleGeometry args={[0.1, 0.36, 4, 14]} />
      </mesh>
      <mesh position={[0, 1.74, 0]} material={m.plaster} castShadow>
        <cylinderGeometry args={[0.058, 0.072, 0.18, 14]} />
      </mesh>

      {product ? (
        <group
          onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { setHover(false); document.body.style.cursor = ""; }}
          onClick={(e) => {
            e.stopPropagation();
            const w = new THREE.Vector3();
            e.eventObject.getWorldPosition(w);
            onPick(product, w);
          }}
        >
          <mesh
            geometry={body}
            position={[0, 1.6, hover ? 0.03 : 0]}
            scale={[1.06, 1, 1.5]}
            material={cloth(product.hex)}
            castShadow
            receiveShadow
          />
        </group>
      ) : null}
    </group>
  );
}

export function Stock({
  m,
  products,
  onPick,
  picked,
}: {
  m: Materials;
  products: Product[];
  onPick: (p: Product, world: THREE.Vector3) => void;
  picked: string | null;
}) {
  /* Shirts hang on the gallery with the boys' sizes; trousers and the rest
     stay on the ground floor. Until the boys' range is actually cut, the
     gallery carries the same pieces — stated honestly in the panel rather
     than filled with invented product. */
  const byAudience = useMemo(
    () => ({
      men: products,
      boys: products.filter((p) => p.type === "shirt"),
    }),
    [products],
  );

  return (
    <group>
      {RAILS.map((spec) => (
        <Rail
          key={spec.id}
          spec={spec}
          products={byAudience[spec.audience].length ? byAudience[spec.audience] : products}
          m={m}
          onPick={onPick}
          picked={picked}
        />
      ))}
      {PLINTHS.map((p, i) => (
        <Plinth key={`${p.x}-${p.z}`} {...p} product={products[i % Math.max(1, products.length)]} m={m} onPick={onPick} />
      ))}
    </group>
  );
}
