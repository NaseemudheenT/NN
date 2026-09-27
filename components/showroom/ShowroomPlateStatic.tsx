"use client";

import { useDayPhase } from "@/components/theme/ThemeProvider";
import { ShowroomPlate } from "./ShowroomPlate";

/** The living room light, at page-header strength. */
export function ShowroomPlateStatic() {
  const { phase } = useDayPhase();
  return <ShowroomPlate phase={phase} subtle />;
}
