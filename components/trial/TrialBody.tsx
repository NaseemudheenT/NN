"use client";

/**
 * The body in the fitting room, and the garment on it.
 *
 * The placeholder body is a set of primitives scaled by lib/fit.ts: chest,
 * waist, hip and shoulder each scale independently off the estimate, so a
 * heavier customer does not simply get a taller version of a thin one. When a
 * real body.glb is supplied it is used instead and scaled the same way.
 *
 * The garment is drawn at the finished measurements of the recommended size, so
 * the gap you can see between cloth and body is the ease the panel is reporting.
 * They are the same numbers.
 */

import { useMemo } from "react";
import * as THREE from "three";
import type { BodyEstimate, SizeFit } from "@/lib/fit";
import type { Product } from "@/lib/catalog/types";
import { OptionalModel } from "@/components/showroom/OptionalModel";
import { TRIAL_MODELS } from "@/components/showroom/assets";
import { MATERIALS } from "@/components/showroom/materials";
import { BackNeckLabel } from "@/components/showroom/objects/Garments";

/** Reference figure the placeholder primitives are authored at. */
const REF = { chestCm: 99, waistCm: 82, hipCm: 99, shoulderCm: 43.5, heightCm: 178 };

/** Circumference in centimetres → radius in metres. */
const radius = (circumferenceCm: number) => circumferenceCm / 100 / (2 * Math.PI);

function Skin({ children, ...props }: React.ComponentProps<"mesh">) {
  return (
    <mesh {...props}>
      {children}
      <meshPhysicalMaterial color="#cbb9a6" roughness={0.68} metalness={0} clearcoat={0.1} />
    </mesh>
  );
}

export function TrialBody({
  body,
  product,
  fit,
  showGarment = true,
}: {
  body: BodyEstimate;
  product: Product | null;
  fit: SizeFit | null;
  showGarment?: boolean;
}) {
  const scale = body.heightCm / REF.heightCm;

  /* Body radii, straight from the estimate. */
  const r = {
    chest: radius(body.chestCm),
    waist: radius(body.waistCm),
    hip: radius(body.hipCm),
  };
  const shoulderHalf = body.shoulderCm / 200;

  /* Garment radii, from the finished measurements of the chosen size. The
     difference between these and the body radii above is visible ease. */
  const garment = useMemo(() => {
    if (!fit) return null;
    const by = (area: string) => fit.areas.find((a) => a.area === area)?.garmentCm;
    return {
      chest: by("chest") ? radius(by("chest")!) : null,
      waist: by("waist") ? radius(by("waist")!) : null,
      hip: by("hip") ? radius(by("hip")!) : null,
      thigh: by("thigh") ? radius(by("thigh")!) : null,
    };
  }, [fit]);

  const isShirt = product?.type === "shirt";

  return (
    <group scale={scale}>
      <OptionalModel
        path={TRIAL_MODELS.body}
        placeholder={
          <group>
            {/* head and neck, kept plain: this is a form, not a portrait */}
            <Skin position={[0, 1.66, 0]}>
              <capsuleGeometry args={[0.088, 0.1, 8, 20]} />
            </Skin>
            <Skin position={[0, 1.53, 0]}>
              <cylinderGeometry args={[0.055, 0.062, 0.1, 16]} />
            </Skin>

            {/* chest and waist, each at its own girth */}
            <Skin position={[0, 1.3, 0]}>
              <cylinderGeometry args={[r.chest, r.waist, 0.34, 28]} />
            </Skin>
            {/* hips */}
            <Skin position={[0, 1.03, 0]}>
              <cylinderGeometry args={[r.waist, r.hip, 0.2, 28]} />
            </Skin>
            {/* shoulders, at the measured breadth */}
            <Skin position={[0, 1.45, 0]} rotation={[0, 0, Math.PI / 2]}>
              <capsuleGeometry args={[0.062, shoulderHalf * 2 - 0.124, 6, 16]} />
            </Skin>
            {/* arms */}
            {[-1, 1].map((side) => (
              <Skin
                key={side}
                position={[side * shoulderHalf, 1.19, 0]}
                rotation={[0, 0, side * 0.06]}
              >
                <capsuleGeometry args={[0.045, 0.46, 6, 14]} />
              </Skin>
            ))}
            {/* legs, at the inseam from the estimate */}
            {[-1, 1].map((side) => (
              <Skin
                key={side}
                position={[side * (r.hip * 0.5), (body.inseamCm / 100) / 2, 0]}
              >
                <capsuleGeometry args={[r.hip * 0.42, body.inseamCm / 100 - r.hip * 0.84, 6, 16]} />
              </Skin>
            ))}
          </group>
        }
      />

      {/* ── the garment, at the finished measurements ── */}
      {showGarment && product && garment ? (
        <group>
          {isShirt && garment.chest && garment.waist ? (
            <>
              <mesh position={[0, 1.3, 0]}>
                <cylinderGeometry args={[garment.chest, garment.waist, 0.42, 30, 1, true]} />
                <meshPhysicalMaterial
                  color={product.hex}
                  roughness={MATERIALS.cotton.roughness}
                  metalness={0}
                  sheen={MATERIALS.cotton.sheen}
                  sheenColor={MATERIALS.cotton.sheenColour}
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.97}
                />
              </mesh>
              {/* sleeves */}
              {[-1, 1].map((side) => (
                <mesh
                  key={side}
                  position={[side * shoulderHalf, 1.2, 0]}
                  rotation={[0, 0, side * 0.06]}
                >
                  <cylinderGeometry args={[0.058, 0.046, 0.5, 14, 1, true]} />
                  <meshPhysicalMaterial
                    color={product.hex}
                    roughness={MATERIALS.cotton.roughness}
                    metalness={0}
                    sheen={MATERIALS.cotton.sheen}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              ))}
              {/* collar and the label behind it */}
              <mesh position={[0, 1.52, 0]}>
                <cylinderGeometry args={[0.072, 0.066, 0.055, 20, 1, true]} />
                <meshPhysicalMaterial
                  color={product.hex}
                  roughness={0.7}
                  metalness={0}
                  side={THREE.DoubleSide}
                />
              </mesh>
              <BackNeckLabel position={[0, 1.5, -0.068]} />
            </>
          ) : null}

          {!isShirt && garment.waist && garment.hip && garment.thigh ? (
            /* Pulled into locals so the narrowing survives into the map below. */
            ((waistR: number, hipR: number, thighR: number) => (
            <>
              <mesh position={[0, 1.02, 0]}>
                <cylinderGeometry args={[waistR, hipR, 0.26, 28, 1, true]} />
                <meshPhysicalMaterial
                  color={product.hex}
                  roughness={MATERIALS.twill.roughness}
                  metalness={0}
                  sheen={MATERIALS.twill.sheen}
                  side={THREE.DoubleSide}
                />
              </mesh>
              {[-1, 1].map((side) => (
                <mesh key={side} position={[side * (r.hip * 0.5), 0.55, 0]}>
                  <cylinderGeometry args={[thighR, thighR * 0.68, 0.72, 16, 1, true]} />
                  <meshPhysicalMaterial
                    color={product.hex}
                    roughness={MATERIALS.twill.roughness}
                    metalness={0}
                    sheen={MATERIALS.twill.sheen}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              ))}
            </>
            ))(garment.waist, garment.hip, garment.thigh)
          ) : null}
        </group>
      ) : null}
    </group>
  );
}
