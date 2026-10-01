/**
 * A handle on the camera, for development only.
 *
 * The choreography in ./choreography is proven exhaustively off-line by
 * `npm run showroom:check`, which is the right place for geometry. What that
 * cannot prove is the wiring: that the rig actually drags the rendered camera
 * along the path it computed. React Three Fiber keeps its state in a store
 * that is not reachable from the DOM, so without this there is no way to ask
 * the running page where the camera is.
 *
 * The camera object is handed over once, on mount, and three.js mutates its
 * position in place — so reading `window.__nnCamera.position` later gives live
 * values at no per-frame cost.
 *
 * Compiled out of production: the constant folds to false and the assignment
 * is dropped, so nothing is attached to window on the real site.
 */

import type { PerspectiveCamera } from "three";

export const DEV_CAMERA = process.env.NODE_ENV !== "production";

export function exposeCamera(camera: PerspectiveCamera, rig: string) {
  if (!DEV_CAMERA || typeof window === "undefined") return;
  (window as unknown as Record<string, unknown>).__nnCamera = camera;
  (window as unknown as Record<string, unknown>).__nnCameraRig = rig;
}
