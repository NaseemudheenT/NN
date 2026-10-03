"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { B } from "./plan";

/**
 * The air.
 *
 * A beam of light is invisible. What you actually see when sun comes
 * through a tall window is the DUST in it — so the shafts in this hall are
 * only half the effect, and this is the other half.
 *
 * Three things make it read as air rather than as confetti:
 *
 *  · DENSITY FOLLOWS THE SUN. Opacity is driven by the beam, so on a grey
 *    afternoon or after dark there is nothing to see — which is correct.
 *    Dust that hangs in the room at midnight is snow.
 *
 *  · YOU NEVER SEE ONE WRAP. A mote that reaches the vault is moved back
 *    to 400 mm BELOW the floor, not to the floor — so the jump happens
 *    inside the stone where no camera in this building can be. Wrapping
 *    in open air, which is the obvious way to write it, makes motes wink
 *    out at the ceiling and wink in at your feet, and that tell is the
 *    difference between air and confetti.
 *
 *  · IT DRIFTS, IT DOES NOT FALL. Motes this small are held up by the air;
 *    they rise on the thermal off a sunlit floor and wander sideways. The
 *    horizontal wander is two sines at different periods per mote, because
 *    one period across a whole system reads as a wave going through it.
 *
 * One BufferGeometry, one draw call, additive. Cheap enough to leave on
 * everywhere, which matters because it is doing more for the light than
 * anything else in the scene costing the same.
 */
export function Dust({ beam, tint, count = 420 }: { beam: number; tint: THREE.Color; count?: number }) {
  const points = useRef<THREE.Points>(null);

  const { geometry, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const s = new Float32Array(count * 4); // rise, phase a, phase b, size

    for (let i = 0; i < count; i += 1) {
      /* Clustered down the nave rather than spread over the whole plan:
         the aisles are in shade and dust you cannot see is dust you are
         paying for. */
      positions[i * 3] = (Math.random() - 0.5) * 13;
      positions[i * 3 + 1] = Math.random() * 11;
      positions[i * 3 + 2] = B.nave.back + 2 + Math.random() * 26;

      s[i * 4] = 0.06 + Math.random() * 0.13;        // metres per second
      s[i * 4 + 1] = Math.random() * Math.PI * 2;
      s[i * 4 + 2] = Math.random() * Math.PI * 2;
      s[i * 4 + 3] = 0.6 + Math.random() * 0.8;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geometry: g, seeds: s };
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.032,
        sizeAttenuation: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [],
  );

  useFrame(({ clock }, dt) => {
    const mesh = points.current;
    if (!mesh) return;

    /* No sun, no dust. Below a tenth of a beam it is switched off entirely
       rather than drawn at two percent — a hundred invisible sprites still
       cost a draw call and a sort. */
    const visible = beam > 0.1;
    mesh.visible = visible;
    if (!visible) return;

    material.opacity = Math.min(0.5, beam * 0.55);
    material.color.copy(tint).lerp(new THREE.Color("#fff4e2"), 0.5);

    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const t = clock.elapsedTime;
    const d = Math.min(dt, 0.05);

    for (let i = 0; i < count; i += 1) {
      const y = i * 3 + 1;
      arr[y] += seeds[i * 4] * d;
      /* two periods, so the system does not breathe as one body */
      arr[i * 3] += Math.sin(t * 0.21 + seeds[i * 4 + 1]) * 0.0016;
      arr[i * 3 + 2] += Math.cos(t * 0.13 + seeds[i * 4 + 2]) * 0.0012;
      if (arr[y] > 11.6) arr[y] = -0.4;
    }
    pos.needsUpdate = true;
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />;
}
