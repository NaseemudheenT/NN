"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { garmentShape, hangerGeometry } from "@/components/showroom/geometry";
import { cloth } from "@/components/showroom/materials";
import { markTexture } from "./mark-texture";
import type { Product } from "@/lib/catalog/types";

/**
 * The piece, turning.
 *
 * Its own small canvas rather than a second camera in the building: it
 * isolates the lighting so the garment is lit for INSPECTION — a soft key,
 * a rim to separate it from the dark, and a bounce underneath — instead of
 * by whatever the hall happens to be doing at that hour. Taking a coat to
 * the window is what you would do in a real shop, and this is the same
 * instinct expressed as a render.
 *
 * It turns by itself, slowly, and stops turning while a hand is on it.
 */
function Piece({ product }: { product: Product }) {
  const g = useRef<THREE.Group>(null);
  const [held, setHeld] = useState(false);
  const spin = useRef(0.42);

  const body = useMemo(
    () => garmentShape(product.type === "trouser" ? 1.15 : 0.95, 0.52, product.type === "trouser" ? 0.46 : 0.58),
    [product.type],
  );
  const hanger = useMemo(() => hangerGeometry(0.52), []);
  const label = useMemo(() => markTexture(), []);
  const material = useMemo(() => cloth(product.hex), [product.hex]);

  const stripe = useMemo(() => {
    if (!product.stripe) return null;
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 4;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = product.hex;
    ctx.fillRect(0, 0, 64, 4);
    ctx.fillStyle = product.stripe;
    ctx.fillRect(0, 0, 3, 4);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(10, 10);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [product.hex, product.stripe]);

  useFrame((_, dt) => {
    if (!g.current) return;
    const target = held ? 0 : 0.42;
    spin.current += (target - spin.current) * (1 - Math.exp(-4 * dt));
    g.current.rotation.y += spin.current * dt;
  });

  return (
    <group
      ref={g}
      position={[0, 0.42, 0]}
      onPointerDown={() => setHeld(true)}
      onPointerUp={() => setHeld(false)}
      onPointerOut={() => setHeld(false)}
      onPointerMove={(e) => {
        if (!held || !g.current) return;
        g.current.rotation.y += e.movementX * 0.006;
      }}
    >
      <mesh geometry={hanger}>
        <meshStandardMaterial color="#c5a059" roughness={0.3} metalness={1} />
      </mesh>
      <mesh geometry={body} position={[0, -0.03, 0]} material={material} castShadow>
        {stripe ? <meshStandardMaterial map={stripe} roughness={0.9} /> : null}
      </mesh>
      {/* the woven neck label — the same mark as the header's */}
      <mesh position={[0, -0.16, -0.058]} rotation-x={0.12}>
        <planeGeometry args={[0.1, 0.055]} />
        <meshStandardMaterial map={label} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function Hologram({ product }: { product: Product }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.1, 2.05], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      {/* key, rim, bounce — the three lights a garment is photographed with */}
      <ambientLight intensity={0.5} color="#e8e4da" />
      <directionalLight position={[2.4, 3.2, 2.6]} intensity={2.6} color="#fff6e8" />
      <directionalLight position={[-2.8, 1.4, -2.2]} intensity={1.5} color="#9fb6d4" />
      <pointLight position={[0, -1.6, 1.4]} intensity={1.4} distance={5} color="#d8cfbd" />
      <Piece product={product} />
    </Canvas>
  );
}
