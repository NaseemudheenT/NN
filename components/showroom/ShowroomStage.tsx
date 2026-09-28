"use client";

import dynamic from "next/dynamic";
import { Fallback2D } from "./Fallback2D";
import { useShowroom } from "@/components/layout/ShowroomProvider";
import type { Product } from "@/lib/types";

/**
 * The room is loaded only when it is going to be shown, and never during
 * server rendering — the page is readable before a single byte of WebGL.
 */
const Showroom = dynamic(() => import("./Showroom").then((m) => m.Showroom), {
  ssr: false,
  loading: () => <StageSkeleton />,
});

function StageSkeleton() {
  const { phase } = useShowroom();
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Fallback2D phase={phase} />
    </div>
  );
}

export function ShowroomStage(props: {
  products: Product[];
  mode?: "scroll" | "viewpoint";
  viewpointId?: string;
  scrollRef?: React.RefObject<number>;
  intro?: boolean;
  className?: string;
}) {
  return <Showroom {...props} />;
}
