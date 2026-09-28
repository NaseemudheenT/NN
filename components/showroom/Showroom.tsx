"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, ContactShadows, PerformanceMonitor, Preload } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { useRouter } from "next/navigation";
import { Room } from "./Room";
import { Garments } from "./Garments";
import { Lighting } from "./Lighting";
import { CameraRig } from "./CameraRig";
import { Fallback2D } from "./Fallback2D";
import { useShowroom, type Quality } from "@/components/layout/ShowroomProvider";
import type { Product } from "@/lib/types";

const DPR: Record<Quality, [number, number]> = {
  high: [1, 2],
  medium: [1, 1.5],
  low: [0.7, 1],
  off: [1, 1],
};

export function Showroom({
  products,
  mode = "scroll",
  viewpointId,
  scrollRef,
  intro = false,
  className = "",
}: {
  products: Product[];
  mode?: "scroll" | "viewpoint";
  viewpointId?: string;
  scrollRef?: React.RefObject<number>;
  intro?: boolean;
  className?: string;
}) {
  const { phase, quality, setQuality, spatial, reducedMotion, setFocus } = useShowroom();
  const router = useRouter();
  const [hovered, setHovered] = useState<Product | null>(null);

  // The light leans toward the cloth under it; derived, so the scene and the
  // rest of the page always agree about which garment is in focus.
  const focusColor = useMemo(
    () => (hovered ? new THREE.Color(hovered.swatch) : null),
    [hovered],
  );

  const onHover = useCallback(
    (p: Product | null) => {
      setHovered(p);
      setFocus(p ? { swatch: p.swatch, title: p.title } : null);
    },
    [setFocus],
  );

  const onSelect = useCallback(
    (p: Product) => {
      router.push(`/product/${p.handle}`);
    },
    [router],
  );

  // No GPU, or the visitor chose the flat shop: draw the room instead.
  if (!spatial || quality === "off") {
    return (
      <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden="true">
        <Fallback2D phase={phase} />
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 ${className}`}>
      <Canvas
        dpr={DPR[quality]}
        shadows={quality !== "low"}
        gl={{
          antialias: quality === "high",
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        camera={{ fov: 42, near: 0.1, far: 90, position: [0, 1.6, 9] }}
        frameloop={reducedMotion ? "demand" : "always"}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1;
        }}
      >
        <PerformanceMonitor
          onDecline={() => setQuality(quality === "high" ? "medium" : "low")}
          flipflops={3}
        />
        <Suspense fallback={null}>
          <Lighting phase={phase} quality={quality} focusColor={focusColor} />
          <Room phase={phase} quality={quality}>
            <Garments
              products={products}
              onSelect={onSelect}
              onHover={onHover}
              focusedHandle={hovered?.handle ?? null}
            />
          </Room>
          {quality !== "low" && (
            <ContactShadows
              position={[0, 0.012, -1]}
              scale={18}
              blur={2.6}
              opacity={phase === "night" ? 0.5 : 0.32}
              far={5}
              resolution={quality === "high" ? 1024 : 512}
            />
          )}
          <Preload all />
        </Suspense>

        <CameraRig
          mode={mode}
          viewpointId={viewpointId}
          scrollRef={scrollRef}
          reducedMotion={reducedMotion}
          intro={intro}
        />

        {quality === "high" && (
          <EffectComposer enableNormalPass={false}>
            {/* bloom only on the sign and the lamps, nothing else */}
            <Bloom intensity={0.42} luminanceThreshold={0.92} luminanceSmoothing={0.3} mipmapBlur />
            <Vignette eskil={false} offset={0.24} darkness={0.55} />
          </EffectComposer>
        )}
        <AdaptiveDpr pixelated={false} />
      </Canvas>
    </div>
  );
}
