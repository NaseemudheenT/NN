"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

/**
 * A photograph, as the room.
 *
 * ── why this exists ──────────────────────────────────────────────────
 * Everything else in this building is generated — geometry from a plan,
 * surfaces from noise. That gets a long way, and it will never get all the
 * way: photorealism comes from photographs. A real camera captured real
 * light bouncing off real stone, and no amount of procedural work
 * reproduces that.
 *
 * So this is the door for real photography. Drop a 360° panorama at
 * `public/room/panorama.jpg` and the hall around you IS that photograph —
 * look anywhere, it is there, correct in every direction, because an
 * equirectangular image mapped to a sphere from its centre is not an
 * approximation of being somewhere. It is the thing itself.
 *
 * ── how it fails ─────────────────────────────────────────────────────
 * Silently and completely. The file is probed with a HEAD request; if it
 * is missing, nothing renders and the built hall carries on exactly as
 * before. There is no broken-image state, no console error and no loading
 * spinner for a file that was never there — which matters because for most
 * of this project's life, it will not be.
 */
export function PhotoRoom({
  onLoaded,
}: {
  /** Told when a real photograph took over, so the built hall can stand down. */
  onLoaded?: (loaded: boolean) => void;
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let cancelled = false;
    const url = "/room/panorama.jpg";

    /* HEAD first. Handing a missing URL straight to the loader logs a 404
       to the console on every visit, which is noise that outlives the
       feature. */
    void fetch(url, { method: "HEAD" })
      .then((res) => {
        if (!res.ok || cancelled) return;
        new THREE.TextureLoader().load(
          url,
          (tex) => {
            if (cancelled) {
              tex.dispose();
              return;
            }
            tex.mapping = THREE.EquirectangularReflectionMapping;
            tex.colorSpace = THREE.SRGBColorSpace;
            setTexture(tex);
            onLoaded?.(true);
          },
          undefined,
          () => {},
        );
      })
      .catch(() => {
        /* offline, or no such file — the built hall is already standing */
      });

    return () => {
      cancelled = true;
    };
  }, [onLoaded]);

  const material = useMemo(
    () =>
      texture
        ? new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
            toneMapped: false,
            fog: false,
          })
        : null,
    [texture],
  );

  useEffect(() => () => material?.dispose(), [material]);

  if (!material) return null;

  /* Radius 60 m, centred on the nave rather than on the origin. A panorama
     sphere has one correct viewpoint — its centre — and putting that at the
     middle of the walkable floor is what keeps the parallax honest as the
     customer moves. */
  return (
    <mesh position={[0, 1.65, -8]} material={material} renderOrder={-1}>
      <sphereGeometry args={[60, 60, 40]} />
    </mesh>
  );
}
