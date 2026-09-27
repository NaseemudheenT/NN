import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { SettingsUI } from "@/components/settings/SettingsUI";

export const metadata: Metadata = {
  title: "Settings",
  description: "How the Nero Noren showroom behaves, what it remembers, and what it counts.",
  alternates: { canonical: "/settings" },
  robots: { index: false, follow: true },
};

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Yours to set"
        lede="How the showroom is lit, what language the stylist prefers, and exactly what this device remembers. Every switch here does something."
      />
      <SettingsUI />
    </>
  );
}
