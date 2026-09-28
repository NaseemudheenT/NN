"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { BRAND } from "@/lib/tokens";

/**
 * The material library. Six surfaces, each behaving differently under light:
 * limestone, travertine, walnut, oak, brushed brass, steel, linen.
 * Nothing in the room is uniformly glossy.
 */
export function useMaterials(floorTint: string) {
  return useMemo(() => {
    const limestone = new THREE.MeshStandardMaterial({
      color: "#cfc7b8",
      roughness: 0.96,
      metalness: 0,
    });
    const limestoneDark = new THREE.MeshStandardMaterial({
      color: "#8f887c",
      roughness: 0.94,
      metalness: 0,
    });
    const travertine = new THREE.MeshStandardMaterial({
      color: floorTint,
      roughness: 0.34,
      metalness: 0.04,
    });
    const walnut = new THREE.MeshStandardMaterial({
      color: "#4a3323",
      roughness: 0.52,
      metalness: 0.04,
    });
    const oak = new THREE.MeshStandardMaterial({
      color: "#9a7b52",
      roughness: 0.66,
      metalness: 0.02,
    });
    const brass = new THREE.MeshStandardMaterial({
      color: BRAND.brass,
      roughness: 0.26,
      metalness: 0.95,
    });
    const brassSoft = new THREE.MeshStandardMaterial({
      color: "#b8933a",
      roughness: 0.42,
      metalness: 0.88,
    });
    const steel = new THREE.MeshStandardMaterial({
      color: "#3c3f43",
      roughness: 0.38,
      metalness: 0.85,
    });
    const bronze = new THREE.MeshStandardMaterial({
      color: "#6b5334",
      roughness: 0.35,
      metalness: 0.9,
    });
    const matteBlack = new THREE.MeshStandardMaterial({
      color: "#141414",
      roughness: 0.82,
      metalness: 0.06,
    });
    const linen = new THREE.MeshStandardMaterial({
      color: BRAND.ivoryWarm,
      roughness: 0.95,
      metalness: 0,
      side: THREE.DoubleSide,
    });

    return {
      limestone,
      limestoneDark,
      travertine,
      walnut,
      oak,
      brass,
      brassSoft,
      steel,
      bronze,
      matteBlack,
      linen,
    };
  }, [floorTint]);
}

/** Cloth: soft, light-responsive, never plastic. */
export function fabricMaterial(color: string) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.92,
    metalness: 0,
    side: THREE.DoubleSide,
  });
}
