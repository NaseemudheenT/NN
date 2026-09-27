"use client";

/**
 * Model, or placeholder.
 *
 * Every object in the showroom is wrapped in this. It consults the manifest to
 * see whether the .glb is actually there; if it is, the model loads inside a
 * Suspense boundary with an error boundary behind it, so even a corrupt file
 * degrades to the placeholder rather than to a blank room. If it is not, the
 * placeholder renders immediately with no network request at all.
 *
 * This is the single mechanism that makes CLAUDE.md's rule true — "every 3D
 * object MUST have a placeholder fallback" — in one place instead of in forty.
 */

import { Component, Suspense, useEffect, useState, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import { hasModel, loadManifest } from "./assets";

/* ── manifest availability, read once per page ─────────────────── */

let notify: (() => void)[] = [];
let ready = false;

function useManifest(): boolean {
  const [, bump] = useState(0);
  useEffect(() => {
    if (ready) return;
    const listener = () => bump((n) => n + 1);
    notify.push(listener);
    void loadManifest().then(() => {
      ready = true;
      notify.forEach((f) => f());
      notify = [];
    });
    return () => {
      notify = notify.filter((f) => f !== listener);
    };
  }, []);
  return ready;
}

/* ── error boundary ────────────────────────────────────────────── */

class ModelBoundary extends Component<
  { fallback: ReactNode; children: ReactNode; path: string },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn(`[showroom] ${this.props.path} could not be loaded, using placeholder:`, error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/* ── the loaded model ──────────────────────────────────────────── */

function LoadedModel({ path, scale = 1 }: { path: string; scale?: number }) {
  const { scene } = useGLTF(path);
  // Clone so the same model can appear more than once — hangers, for instance.
  return <primitive object={scene.clone(true)} scale={scale} />;
}

export interface OptionalModelProps {
  /** Path under /public/models, from assets.ts. */
  path?: string | null;
  /** Drawn when the model is absent or fails. Always provide one. */
  placeholder: ReactNode;
  scale?: number;
  children?: never;
}

export function OptionalModel({ path, placeholder, scale = 1 }: OptionalModelProps) {
  const manifestReady = useManifest();

  // Until the manifest is known, show the placeholder. It is the right thing to
  // look at anyway, and it means the first frame never waits on a fetch.
  if (!manifestReady || !path || !hasModel(path)) return <>{placeholder}</>;

  return (
    <ModelBoundary fallback={placeholder} path={path}>
      <Suspense fallback={placeholder}>
        <LoadedModel path={path} scale={scale} />
      </Suspense>
    </ModelBoundary>
  );
}
