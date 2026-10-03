"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { Room, Outside } from "./Room";
import { Fixtures } from "./Fixtures";
import { Lighting } from "./Lighting";
import { PLAN } from "./plan";
import { buildMaterials, disposeMaterials } from "./materials";
import type { SkyState } from "@/lib/daytime";

/* A RectAreaLight is black until its lookup tables are uploaded. Doing it
   once at module scope is both sufficient and cheap. */
RectAreaLightUniformsLib.init();

/**
 * The camera.
 *
 * Three inputs, each doing one job, summed and then damped so the result is
 * a single continuous movement rather than three arguing:
 *
 *   drift    a slow lateral breath, ±90 mm over about 40 s. Below conscious
 *            notice; its only purpose is that a perfectly still camera
 *            reads as a photograph and a slightly moving one reads as a
 *            point of view.
 *   pointer  ±180 mm of parallax. The visitor leans; the room responds.
 *   scroll   walks the camera 11 m up the nave as the page scrolls, so
 *            reading the homepage IS the approach to the great window.
 *
 * Damping is per-frame-rate-corrected (1 - e^(-k·dt)) rather than a fixed
 * lerp, so the motion is identical on a 60 Hz laptop and a 120 Hz phone
 * instead of being twice as fast on one of them.
 */
function CameraRig({ still }: { still: boolean }) {
  const { camera } = useThree();
  const scroll = useRef(0);
  const pointer = useRef(new THREE.Vector2());
  const current = useRef(new THREE.Vector3(...PLAN.camera.position));
  const lookAt = useRef(new THREE.Vector3(...PLAN.camera.target));
  const desired = useMemo(() => new THREE.Vector3(), []);
  const desiredLook = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const onScroll = () => {
      const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
      scroll.current = Math.min(1, window.scrollY / Math.min(max, window.innerHeight * 2.4));
    };
    const onMove = (e: PointerEvent) => {
      pointer.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        (e.clientY / window.innerHeight) * 2 - 1,
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    if (!window.matchMedia("(pointer: coarse)").matches) {
      window.addEventListener("pointermove", onMove, { passive: true });
    }
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  useFrame(({ clock }, dt) => {
    const [bx, by, bz] = PLAN.camera.position;
    const [tx, ty, tz] = PLAN.camera.target;
    const walk = scroll.current;

    if (still) {
      camera.position.set(bx, by, bz);
      camera.lookAt(tx, ty, tz);
      return;
    }

    const t = clock.elapsedTime;
    desired.set(
      bx + Math.sin(t * 0.157) * 0.09 + pointer.current.x * 0.18,
      by + Math.sin(t * 0.111) * 0.04 - pointer.current.y * 0.11,
      bz - walk * 11,
    );
    desiredLook.set(
      tx + pointer.current.x * 0.5,
      ty - pointer.current.y * 0.34 - walk * 0.7,
      tz,
    );

    /* frame-rate independent damping — same feel at 60 Hz and 120 Hz */
    const k = 1 - Math.exp(-2.6 * Math.min(dt, 0.1));
    current.current.lerp(desired, k);
    lookAt.current.lerp(desiredLook, k);
    camera.position.copy(current.current);
    camera.lookAt(lookAt.current);
  });

  return null;
}

export function Scene({
  sky,
  colours,
  still,
  quality,
}: {
  sky: SkyState;
  colours: string[];
  still: boolean;
  quality: "high" | "low";
}) {
  const { gl } = useThree();
  const m = useMemo(() => buildMaterials(), []);
  useEffect(() => () => disposeMaterials(m), [m]);

  /* Exposure is the eye adapting: the hall at midnight is not a dark version
     of the hall at noon, it is a hall your pupils have opened for. */
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = sky.exposure;
  }, [gl, sky.exposure]);

  const tint = useMemo(() => {
    const [r, g, b] = sky.rgb;
    return new THREE.Color(r, g, b);
  }, [sky.rgb]);

  return (
    <>
      <CameraRig still={still} />
      {/* Fog is the air in the hall. It is tinted by the sun and it thins as
          the lamps come up, because a lit room's haze is lit haze. */}
      <fogExp2 attach="fog" args={[tint.clone().lerp(new THREE.Color("#0c0f16"), 0.72).getHex(), 0.0082]} />
      <Lighting sky={sky} quality={quality} />
      <Room m={m} quality={quality} />
      <Outside tint={tint} lampLevel={sky.lampLevel} />
      <Fixtures m={m} colours={colours} still={still} quality={quality} />
    </>
  );
}
