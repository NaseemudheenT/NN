"use client";

/**
 * The environment metal is reflecting, built rather than downloaded.
 *
 * drei's `<Environment preset="...">` fetches a multi-megabyte HDR from a
 * public CDN at runtime. That is three problems at once: a third-party request
 * on every first visit, several megabytes against a four-second budget, and a
 * canvas that silently suspends forever when the CDN is slow or blocked.
 *
 * So we build the environment instead, out of a handful of emissive planes —
 * drei's Lightformers, the same idea as the softboxes in a photographic studio.
 * It renders once into a small cube map and costs nothing after that. Brass
 * still reads as brass, because what makes brass look like brass is having
 * something bright and shaped to reflect.
 *
 * When a real photographed .hdr is supplied it is used instead; this is the
 * floor, not the ceiling.
 */

import { Environment, Lightformer } from "@react-three/drei";

export interface ProceduralEnvironmentProps {
  /** Colour of the main source — the windows, or the key light. */
  keyColour?: string;
  /** Colour of the fill, usually cooler: sky, or a bounce card. */
  fillColour?: string;
  /** 0–1. At night this drops and the warm sources take over. */
  daylight?: number;
  /** Warm interior sources, for lamps and the backlit sign. */
  lampColour?: string;
  lampLevel?: number;
  intensity?: number;
  resolution?: number;
}

export function ProceduralEnvironment({
  keyColour = "#ffffff",
  fillColour = "#bcd0e4",
  daylight = 1,
  lampColour = "#ffd9a0",
  lampLevel = 0,
  intensity = 1,
  resolution = 64,
}: ProceduralEnvironmentProps) {
  return (
    // frames={1} renders the cube map once. Nothing in here moves, so
    // re-rendering it every frame would be pure waste.
    <Environment resolution={resolution} frames={1} background={false} environmentIntensity={intensity}>
      {/* the window wall: one tall, soft source, the way daylight actually
          arrives in a room with glazing down one side */}
      <Lightformer
        form="rect"
        intensity={2.6 * daylight}
        color={keyColour}
        position={[-5, 1.5, -1]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[8, 5, 1]}
      />
      {/* sky above, which is what fills the shadows and keeps them blue */}
      <Lightformer
        form="rect"
        intensity={1.1 * daylight}
        color={fillColour}
        position={[0, 6, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[10, 10, 1]}
      />
      {/* a bounce off the floor, so undersides are not dead */}
      <Lightformer
        form="rect"
        intensity={0.45 * daylight}
        color="#e8dcc6"
        position={[0, -3, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[10, 10, 1]}
      />
      {/* a rim from behind, which is what puts the bright edge on a metal
          object and makes it read as solid rather than flat */}
      <Lightformer
        form="rect"
        intensity={1.4}
        color={keyColour}
        position={[4, 2, -4]}
        rotation={[0, -Math.PI / 4, 0]}
        scale={[4, 4, 1]}
      />
      {/* the interior lamps, which take over as the daylight goes */}
      <Lightformer
        form="circle"
        intensity={3.2 * lampLevel}
        color={lampColour}
        position={[2.5, 3, 1.5]}
        scale={[1.6, 1.6, 1]}
      />
      <Lightformer
        form="circle"
        intensity={2.2 * lampLevel}
        color={lampColour}
        position={[-2.5, 2.6, 2]}
        scale={[1.2, 1.2, 1]}
      />
    </Environment>
  );
}
